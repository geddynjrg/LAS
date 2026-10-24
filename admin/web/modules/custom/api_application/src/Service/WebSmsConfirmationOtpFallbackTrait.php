<?php

namespace Drupal\api_application\Service;

/**
 * Member confirmation OTP fallback, device hints, and audit helpers.
 */
trait WebSmsConfirmationOtpFallbackTrait {

  /**
   * Cache key for LMS-only plaintext OTP reveal (never logged).
   */
  protected function getMemberOtpFallbackCacheKey(string $applicationId, string $memberId): string {
    return 'member_otp_fallback:' . $applicationId . ':' . $memberId;
  }

  /**
   * Cache key for officer reveal correlation.
   */
  protected function getMemberOtpRevealCacheKey(string $applicationId, string $memberId): string {
    return 'member_otp_reveal:' . $applicationId . ':' . $memberId;
  }

  /**
   * Normalize constituency names for matching LMS and loans portal values.
   */
  protected function normalizeConstituencyName(string $name): string {
    $name = preg_replace('/\s+/', ' ', strtoupper(trim($name)));
    return is_string($name) ? $name : '';
  }

  /**
   * Best-effort email for smartphone inference (members table has no email column).
   */
  protected function lookupLikelyEmail(array $member): string {
    $email = trim((string) ($member['email'] ?? ''));
    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
      return $email;
    }

    $phone = preg_replace('/\D+/', '', (string) ($member['phoneNumber'] ?? ''));
    if ($phone === '') {
      return '';
    }

    try {
      $db = $this->getWebDatabase();
      $suffix = substr($phone, -9);
      if ($suffix === '') {
        return '';
      }
      $query = $db->select('users', 'u')
        ->fields('u', ['email', 'phoneNumber'])
        ->isNotNull('email')
        ->condition('email', '', '<>')
        ->condition('phoneNumber', '%' . $db->escapeLike($suffix), 'LIKE')
        ->range(0, 8);
      foreach ($query->execute() as $user) {
        $userPhone = preg_replace('/\D+/', '', (string) ($user->phoneNumber ?? ''));
        if ($userPhone !== '' && substr($userPhone, -9) === $suffix && filter_var((string) $user->email, FILTER_VALIDATE_EMAIL)) {
          return (string) $user->email;
        }
      }
    }
    catch (\Exception $e) {
      // Users table lookup is optional intelligence only.
    }

    return '';
  }

  /**
   * Infer whether a member likely has a smartphone that can run the Uwezo App.
   */
  protected function inferMemberDeviceProfile(array $member, bool $app_ok): array {
    $hasEmail = $this->lookupLikelyEmail($member) !== '';

    if ($app_ok) {
      return [
        'profile' => 'smartphone_with_app',
        'label' => 'This member already uses the Uwezo Fund app, so they have a smartphone with the app installed.',
        'encourage_app' => FALSE,
        'likely_smartphone' => TRUE,
        'likely_feature_phone' => FALSE,
      ];
    }

    if ($hasEmail) {
      return [
        'profile' => 'likely_smartphone_no_app',
        'label' => 'This member likely has a smartphone (an email address is on file) but is not signed in on the Uwezo Fund app. Encourage them to download and install the Uwezo App so they can receive codes when SMS is down.',
        'encourage_app' => TRUE,
        'likely_smartphone' => TRUE,
        'likely_feature_phone' => FALSE,
      ];
    }

    return [
      'profile' => 'likely_feature_phone',
      'label' => 'This member may be using a feature phone (no Uwezo App, no email on file). Feature phones cannot install the app. If they can access a smartphone, encourage them to download the Uwezo App; otherwise wait for SMS or use this code only with their consent.',
      'encourage_app' => TRUE,
      'likely_smartphone' => FALSE,
      'likely_feature_phone' => TRUE,
    ];
  }

  /**
   * Store an ephemeral plaintext OTP for LMS officers when SMS fails.
   *
   * Plaintext is cache-only, never written to logs or the audit table.
   */
  protected function storeMemberOtpFallback(string $applicationId, array $member, string $otpCode, bool $sms_ok, bool $app_ok): void {
    $internalAppId = $this->resolveInternalApplicationId($applicationId);
    $db = $this->getWebDatabase();
    $group = [];
    $publicId = $applicationId;

    if ($internalAppId) {
      try {
        $group = $db->select('group_data', 'g')
          ->fields('g', ['groupName', 'constituency'])
          ->condition('applicationId', $internalAppId)
          ->range(0, 1)
          ->execute()
          ->fetchAssoc() ?: [];
        $foundPublic = $db->select('applications', 'a')
          ->fields('a', ['applicationId'])
          ->condition('id', $internalAppId)
          ->range(0, 1)
          ->execute()
          ->fetchField();
        if ($foundPublic) {
          $publicId = (string) $foundPublic;
        }
      }
      catch (\Exception $e) {
        $group = [];
      }
    }

    $device = $this->inferMemberDeviceProfile($member, $app_ok);
    $now = $this->time->getCurrentTime();
    $ttl = self::MEMBER_OTP_TTL;
    $payload = [
      'otp_code' => $otpCode,
      'sms_ok' => $sms_ok,
      'app_ok' => $app_ok,
      'member_id' => (string) ($member['id'] ?? ''),
      'national_id_code' => (string) ($member['nationalIdCode'] ?? ''),
      'member_name' => (string) ($member['fullname'] ?? 'Member'),
      'phone' => (string) ($member['phoneNumber'] ?? ''),
      'application_id' => $publicId,
      'internal_application_id' => (string) $internalAppId,
      'group_name' => (string) ($group['groupName'] ?? ''),
      'constituency' => (string) ($group['constituency'] ?? ''),
      'device_profile' => $device['profile'],
      'device_label' => $device['label'],
      'encourage_app' => $device['encourage_app'],
      'likely_smartphone' => $device['likely_smartphone'],
      'likely_feature_phone' => $device['likely_feature_phone'],
      'expires' => $now + $ttl,
      'expires_at' => date('Y-m-d H:i:s', $now + $ttl),
    ];

    \Drupal::cache('default')->set(
      $this->getMemberOtpFallbackCacheKey($applicationId, (string) ($member['id'] ?? '')),
      $payload,
      $now + $ttl
    );
    if ($publicId !== $applicationId) {
      \Drupal::cache('default')->set(
        $this->getMemberOtpFallbackCacheKey($publicId, (string) ($member['id'] ?? '')),
        $payload,
        $now + $ttl
      );
    }
  }

  /**
   * Pending SMS-failed OTPs for constituency officers.
   *
   * @param string[] $constituencyNames
   *
   * @return array<int, array<string, mixed>>
   */
  public function listSmsFailedOtpsForConstituencies(array $constituencyNames): array {
    $wanted = [];
    foreach ($constituencyNames as $name) {
      $normalized = $this->normalizeConstituencyName((string) $name);
      if ($normalized !== '') {
        $wanted[$normalized] = TRUE;
      }
    }
    if ($wanted === []) {
      return [];
    }

    $nowSql = date('Y-m-d H:i:s', $this->time->getCurrentTime());
    $db = $this->getWebDatabase();
    $items = [];

    try {
      $query = $db->select('member_data', 'm');
      $query->join('applications', 'a', 'a.id = m.applicationId');
      $query->leftJoin('group_data', 'g', 'g.applicationId = a.id');
      $query->fields('m', [
        'id',
        'fullname',
        'nationalIdCode',
        'phoneNumber',
        'confirmation_status',
        'confirmation_token_expires_at',
      ]);
      $query->addField('a', 'applicationId', 'public_application_id');
      $query->addField('a', 'id', 'internal_application_id');
      $query->addField('g', 'groupName', 'group_name');
      $query->addField('g', 'constituency', 'constituency');
      $query->condition('m.requiresConfirmation', 1);
      $query->condition('m.confirmation_status', 'sent');
      $query->condition('m.confirmation_token_expires_at', $nowSql, '>');
      $rows = $query->execute()->fetchAll(\PDO::FETCH_ASSOC) ?: [];
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to list SMS-fallback OTPs: @error', [
        '@error' => $e->getMessage(),
      ]);
      return [];
    }

    foreach ($rows as $row) {
      $constituency = $this->normalizeConstituencyName((string) ($row['constituency'] ?? ''));
      if ($constituency === '' || !isset($wanted[$constituency])) {
        continue;
      }

      $applicationId = (string) ($row['public_application_id'] ?? '');
      $memberId = (string) ($row['id'] ?? '');
      $cached = \Drupal::cache('default')->get($this->getMemberOtpFallbackCacheKey($applicationId, $memberId));
      if (!is_object($cached) || empty($cached->data['otp_code'])) {
        $cached = \Drupal::cache('default')->get(
          $this->getMemberOtpFallbackCacheKey((string) ($row['internal_application_id'] ?? ''), $memberId)
        );
      }
      if (!is_object($cached) || empty($cached->data['otp_code'])) {
        continue;
      }

      $data = $cached->data;
      if (!empty($data['sms_ok'])) {
        continue;
      }

      $items[] = [
        'application_id' => $applicationId,
        'member_id' => $memberId,
        'national_id_code' => (string) ($row['nationalIdCode'] ?? $data['national_id_code'] ?? ''),
        'member_name' => (string) ($row['fullname'] ?? $data['member_name'] ?? 'Member'),
        'phone' => (string) ($row['phoneNumber'] ?? $data['phone'] ?? ''),
        'group_name' => (string) ($row['group_name'] ?? $data['group_name'] ?? ''),
        'constituency' => (string) ($row['constituency'] ?? $data['constituency'] ?? ''),
        'otp_code' => (string) $data['otp_code'],
        'expires_at' => (string) ($data['expires_at'] ?? $row['confirmation_token_expires_at'] ?? ''),
        'sms_ok' => FALSE,
        'app_ok' => !empty($data['app_ok']),
        'device_profile' => (string) ($data['device_profile'] ?? ''),
        'device_label' => (string) ($data['device_label'] ?? ''),
        'encourage_app' => !empty($data['encourage_app']),
        'likely_smartphone' => !empty($data['likely_smartphone']),
        'likely_feature_phone' => !empty($data['likely_feature_phone']),
      ];
    }

    return $items;
  }

  /**
   * Record that an LMS officer viewed fallback codes (no OTP in logs/audit).
   *
   * @param array<string, string> $officer
   * @param array<int, array<string, mixed>> $items
   *
   * @return array<string, mixed>
   */
  public function recordOfficerOtpReveal(array $officer, array $items): array {
    $recorded = 0;
    foreach ($items as $item) {
      if (!is_array($item)) {
        continue;
      }
      $applicationId = trim((string) ($item['application_id'] ?? ''));
      $memberId = trim((string) ($item['member_id'] ?? ''));
      $nationalId = trim((string) ($item['national_id_code'] ?? ''));
      if ($applicationId === '') {
        continue;
      }

      $member = $nationalId !== '' ? $this->loadMemberForOtp($applicationId, $nationalId) : NULL;
      if (!$member && $memberId !== '') {
        try {
          $member = $this->getWebDatabase()->select('member_data', 'm')
            ->fields('m')
            ->condition('id', $memberId)
            ->range(0, 1)
            ->execute()
            ->fetchAssoc() ?: NULL;
        }
        catch (\Exception $e) {
          $member = NULL;
        }
      }
      if (!$member) {
        continue;
      }

      $memberId = (string) $member['id'];
      $cached = \Drupal::cache('default')->get($this->getMemberOtpFallbackCacheKey($applicationId, $memberId));
      if (!is_object($cached) || empty($cached->data['otp_code'])) {
        continue;
      }

      $reveal = [
        'otp_code' => (string) $cached->data['otp_code'],
        'revealed_at' => $this->time->getCurrentTime(),
        'officer_id' => (string) ($officer['officer_id'] ?? ''),
        'officer_name' => (string) ($officer['officer_name'] ?? ''),
        'officer_email' => (string) ($officer['officer_email'] ?? ''),
        'officer_constituency' => (string) ($officer['officer_constituency'] ?? ''),
        'officer_ip' => (string) ($officer['officer_ip'] ?? ''),
        'application_id' => $applicationId,
        'national_id_code' => (string) ($member['nationalIdCode'] ?? $nationalId),
      ];
      $expire = (int) ($cached->data['expires'] ?? ($this->time->getCurrentTime() + self::MEMBER_OTP_TTL));
      \Drupal::cache('default')->set(
        $this->getMemberOtpRevealCacheKey($applicationId, $memberId),
        $reveal,
        $expire
      );

      $this->writeConfirmationAudit('reveal', $applicationId, $member, [
        'source' => 'lms_officer',
        'confidence' => 'high',
        'reason' => 'Constituency officer viewed the SMS-fallback code in LMS.',
        'officer' => $reveal,
      ], [
        'client' => 'lms',
      ]);
      $recorded++;
    }

    return [
      'success' => TRUE,
      'recorded' => $recorded,
    ];
  }

  /**
   * Decide whether a typed code came from LMS, the Uwezo App, or the loans portal.
   *
   * @param array<string, mixed> $context
   *
   * @return array<string, mixed>
   */
  protected function inferOtpEntrySource(string $applicationId, array $member, string $otpCode, array $context): array {
    $client = strtolower(trim((string) ($context['client'] ?? $context['source_hint'] ?? '')));
    $ua = (string) ($context['user_agent'] ?? '');
    $memberId = (string) ($member['id'] ?? '');
    $reveal = \Drupal::cache('default')->get($this->getMemberOtpRevealCacheKey($applicationId, $memberId));
    $revealData = (is_object($reveal) && is_array($reveal->data)) ? $reveal->data : [];
    $fallback = \Drupal::cache('default')->get($this->getMemberOtpFallbackCacheKey($applicationId, $memberId));
    $fallbackData = (is_object($fallback) && is_array($fallback->data)) ? $fallback->data : [];

    $isAppClient = $client === 'uwezo_app'
      || stripos($ua, 'UwezoFundApp') !== FALSE
      || stripos($ua, 'Capacitor') !== FALSE;

    if ($isAppClient) {
      return [
        'source' => 'uwezo_app',
        'confidence' => 'high',
        'reason' => 'Client identified as the Uwezo Fund app.',
        'officer' => $revealData,
      ];
    }

    if ($revealData && hash_equals((string) ($revealData['otp_code'] ?? ''), $otpCode)) {
      return [
        'source' => 'lms_officer',
        'confidence' => 'high',
        'reason' => 'Matching code was shown to a constituency officer in LMS.',
        'officer' => $revealData,
      ];
    }

    if ($revealData && !empty($revealData['revealed_at']) && ($this->time->getCurrentTime() - (int) $revealData['revealed_at']) <= self::MEMBER_OTP_TTL) {
      return [
        'source' => 'lms_officer',
        'confidence' => 'medium',
        'reason' => 'A constituency officer viewed this member OTP in LMS during the code lifetime.',
        'officer' => $revealData,
      ];
    }

    if (!empty($fallbackData['app_ok']) && empty($fallbackData['sms_ok'])) {
      return [
        'source' => 'uwezo_app',
        'confidence' => 'inferred',
        'reason' => 'SMS failed and the code was delivered to the Uwezo Fund app.',
        'officer' => [],
      ];
    }

    return [
      'source' => 'loans_portal',
      'confidence' => 'inferred',
      'reason' => 'Code typed on the loans portal without an LMS reveal match or app client signal.',
      'officer' => [],
    ];
  }

  /**
   * Create the audit table if needed.
   */
  protected function ensureConfirmationAuditTable(): void {
    static $ready = FALSE;
    if ($ready) {
      return;
    }

    $schema = $this->getWebDatabase()->schema();
    if (!$schema->tableExists('member_confirmation_audit')) {
      $this->getWebDatabase()->query("
        CREATE TABLE IF NOT EXISTS member_confirmation_audit (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          application_id VARCHAR(64) NULL,
          national_id_code VARCHAR(32) NULL,
          member_name VARCHAR(255) NULL,
          phone VARCHAR(32) NULL,
          source VARCHAR(32) NOT NULL,
          source_confidence VARCHAR(16) NULL,
          source_reason VARCHAR(255) NULL,
          action VARCHAR(32) NOT NULL DEFAULT 'verify',
          officer_id VARCHAR(64) NULL,
          officer_name VARCHAR(255) NULL,
          officer_email VARCHAR(255) NULL,
          officer_constituency VARCHAR(128) NULL,
          officer_ip VARCHAR(64) NULL,
          client_hint VARCHAR(64) NULL,
          created_at DATETIME NOT NULL,
          INDEX idx_mca_app (application_id),
          INDEX idx_mca_created (created_at),
          INDEX idx_mca_officer (officer_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      ");
    }
    $ready = TRUE;
  }

  /**
   * Persist an OTP reveal or verify event. Never stores the OTP itself.
   *
   * @param array<string, mixed> $inferred
   * @param array<string, mixed> $context
   */
  protected function writeConfirmationAudit(string $action, string $applicationId, array $member, array $inferred, array $context = []): void {
    try {
      $this->ensureConfirmationAuditTable();
      $officer = is_array($inferred['officer'] ?? NULL) ? $inferred['officer'] : [];
      $uuid = \Drupal::service('uuid')->generate();
      $this->getWebDatabase()->insert('member_confirmation_audit')
        ->fields([
          'id' => $uuid,
          'application_id' => substr($applicationId, 0, 64),
          'national_id_code' => substr((string) ($member['nationalIdCode'] ?? ''), 0, 32),
          'member_name' => substr((string) ($member['fullname'] ?? ''), 0, 255),
          'phone' => substr((string) ($member['phoneNumber'] ?? ''), 0, 32),
          'source' => substr((string) ($inferred['source'] ?? 'unknown'), 0, 32),
          'source_confidence' => substr((string) ($inferred['confidence'] ?? ''), 0, 16),
          'source_reason' => substr((string) ($inferred['reason'] ?? ''), 0, 255),
          'action' => substr($action, 0, 32),
          'officer_id' => substr((string) ($officer['officer_id'] ?? ''), 0, 64),
          'officer_name' => substr((string) ($officer['officer_name'] ?? ''), 0, 255),
          'officer_email' => substr((string) ($officer['officer_email'] ?? ''), 0, 255),
          'officer_constituency' => substr((string) ($officer['officer_constituency'] ?? ''), 0, 128),
          'officer_ip' => substr((string) ($officer['officer_ip'] ?? ''), 0, 64),
          'client_hint' => substr((string) ($context['client'] ?? $context['source_hint'] ?? ''), 0, 64),
          'created_at' => date('Y-m-d H:i:s', $this->time->getCurrentTime()),
        ])
        ->execute();
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to write member confirmation audit: @error', [
        '@error' => $e->getMessage(),
      ]);
    }
  }

}
