<?php

namespace Drupal\api_auth\Service;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Mail\MailManagerInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\sms_providers\Service\SmsServiceInterface;
use Drupal\user\UserInterface;

/**
 * Service for OTP-based authentication.
 */
class OtpAuthService implements OtpAuthServiceInterface {

  use StringTranslationTrait;

  // Cache constants.
  public const CACHE_TAG_OTP = 'otp_request';

  public const CACHE_TAG_RATE_LIMIT = 'otp_rate_limit';

  public const CONFIG_MESSAGE_TEMPLATE = 'otp.message_template';

  public const CONFIG_OTP_EXPIRY = 'otp.expiry';

  // Configuration constants.
  public const CONFIG_OTP_LENGTH = 'otp.length';

  public const CONFIG_OTP_MAX_ATTEMPTS = 'otp.max_attempts';

  public const CONFIG_OTP_RATE_LIMIT = 'otp.rate_limit';

  public const CONFIG_IP_RATE_LIMIT = 'otp.ip_rate_limit';

  public const CONFIG_PHONE_FIELD = 'otp.user_phone_field';

  public const CONFIG_USERNAME_PREFIX = 'otp.username_prefix';

  /**
   * The cache backend.
   */
  protected CacheBackendInterface $cache;

  /**
   * The config factory.
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * The entity type manager.
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * The JWT service.
   */
  protected ApiJwtService $jwtService;

  /**
   * The SMS service.
   */
  protected SmsServiceInterface $smsService;

  /**
   * The mail manager.
   */
  protected MailManagerInterface $mailManager;

  /**
   * Constructs an OtpAuthService object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\sms_providers\Service\SmsServiceInterface $sms_service
   *   The SMS service.
   * @param \Drupal\api_auth\Service\ApiJwtService $jwt_service
   *   The JWT service.
   * @param \Drupal\Core\Cache\CacheBackendInterface $cache
   *   The cache backend.
   * @param \Drupal\Core\Mail\MailManagerInterface $mail_manager
   *   The mail manager (email OTP failover).
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    EntityTypeManagerInterface $entity_type_manager,
    SmsServiceInterface $sms_service,
    ApiJwtService $jwt_service,
    CacheBackendInterface $cache,
    MailManagerInterface $mail_manager,
  ) {
    $this->configFactory = $config_factory;
    $this->entityTypeManager = $entity_type_manager;
    $this->smsService = $sms_service;
    $this->jwtService = $jwt_service;
    $this->cache = $cache;
    $this->mailManager = $mail_manager;
  }

  /**
   * {@inheritdoc}
   */
  public function findOrCreateUserByPhone(string $phone_number): UserInterface {
    $config = $this->configFactory->get('api_auth.settings');
    $phone_field = $config->get(self::CONFIG_PHONE_FIELD) ?: 'field_phone_number';

    // Try to find existing user.
    $user_storage = $this->entityTypeManager->getStorage('user');
    $query = $user_storage->getQuery()
      ->condition($phone_field, $phone_number)
      ->condition('status', 1)
      ->accessCheck(FALSE)
      ->range(0, 1);

    $uids = $query->execute();

    if (!empty($uids)) {
      return $user_storage->load(reset($uids));
    }

    // Check if phone number is already used by another user.
    if ($this->phoneNumberExists($phone_number)) {
      throw new \Exception('Phone number is already associated with another account.');
    }

    // Create new user.
    $username_prefix = $config->get(self::CONFIG_USERNAME_PREFIX) ?: 'user_';
    $username = $username_prefix . preg_replace('/[^0-9]/', '', $phone_number);

    // Ensure username is unique.
    $original_username = $username;
    $counter = 1;

    while ($this->usernameExists($username)) {
      $username = $original_username . '_' . $counter;
      ++$counter;
    }

    try {
      $user = $user_storage->create([
        'name' => $username,
        'status' => 1,
        $phone_field => $phone_number,
      ]);

      $user->save();

      return $user;
    }
    catch (\Exception $e) {
      // Handle database constraint violations.
      if (str_contains($e->getMessage(), 'Duplicate entry') || str_contains($e->getMessage(), 'UNIQUE constraint')) {
        throw new \Exception('Phone number is already associated with another account.');
      }

      throw $e;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function isValidPhoneNumber(string $phone_number): bool {
    // Basic phone number validation (international format).
    if (!preg_match('/^\+?[1-9]\d{8,14}$/', $phone_number)) {
      return FALSE;
    }

    return TRUE;
  }

  /**
   * {@inheritdoc}
   */
  public function isValidRequest(string $request_id): bool {
    $cache_data = $this->cache->get($this->getOtpCacheKey($request_id));

    return $cache_data && $cache_data->data;
  }

  /**
   * {@inheritdoc}
   */
  public function requestOtp(string $phone_number, ?string $email = NULL): array {
    // Validate phone number format.
    if (!$this->isValidPhoneNumber($phone_number)) {
      return [
        'success' => FALSE,
        'error' => $this->t('Invalid phone number format.'),
      ];
    }

    // Check phone number rate limiting.
    if (!$this->checkRateLimit($phone_number)) {
      return [
        'success' => FALSE,
        'error' => $this->t('Too many requests for this number. Please try again later.'),
      ];
    }

    // Check IP-based rate limiting.
    if (!$this->checkIpRateLimit()) {
      return [
        'success' => FALSE,
        'error' => $this->t('Too many requests from your location. Please try again later.'),
      ];
    }

    $config = $this->configFactory->get('api_auth.settings');
    $email = $this->normalizeEmail($email) ?: $this->findEmailForPhone($phone_number);

    // Generate OTP code.
    $otp_code = $this->generateOtpCode();

    // Generate unique request ID.
    $request_id = 'otp_req_' . bin2hex(random_bytes(16));

    // Store OTP data in cache.
    $otp_data = [
      'phone_number' => $phone_number,
      'otp_code' => password_hash($otp_code, \PASSWORD_DEFAULT),
      'created' => time(),
      'attempts' => 0,
    ];

    $expiry = $config->get(self::CONFIG_OTP_EXPIRY) ?: 300;
    $this->cache->set(
      $this->getOtpCacheKey($request_id),
      $otp_data,
      time() + $expiry,
      [self::CACHE_TAG_OTP]
    );

    // Send SMS first.
    $message_template = $config->get(self::CONFIG_MESSAGE_TEMPLATE) ?: 'Your login code is: [code]';
    $message = str_replace('[code]', $otp_code, $message_template);

    $sms_result = $this->smsService->sendSms($phone_number, $message);
    // Also notify signed-in Uwezo Fund app (inbox/FCM).
    $app_notified = $this->notifyAppPushOtp($phone_number, $message, $email);
    if (!empty($sms_result['success'])) {
      $this->updateRateLimit($phone_number);
      $this->updateIpRateLimit();

      return [
        'success' => TRUE,
        'request_id' => $request_id,
        'delivery_channel' => 'sms',
        'message' => $this->t('Verification code sent by SMS to @phone and to the Uwezo Fund app if you stayed signed in. Enter the 6-digit code here.', [
          '@phone' => $this->maskPhoneNumber($phone_number),
        ]),
        'expires_in' => $expiry,
      ];
    }

    // SMS failed — email failover (same OTP). WhatsApp is not used yet
    // (Meta Business API still test-only for this tenant).
    \Drupal::logger('api_auth')->warning('OTP SMS failed for @phone; attempting email failover.', [
      '@phone' => $this->maskPhoneNumber($phone_number),
    ]);

    $resolved_email = $this->normalizeEmail($email) ?: $this->findEmailForPhone($phone_number);
    if ($resolved_email) {
      if ($this->sendOtpEmail($resolved_email, $otp_code)) {
        $this->updateRateLimit($phone_number);
        $this->updateIpRateLimit();
        $masked = $this->maskEmail($resolved_email);
        return [
          'success' => TRUE,
          'request_id' => $request_id,
          'delivery_channel' => 'email',
          'masked_email' => $masked,
          'message' => $this->t('SMS unavailable — we sent a code to your email (@email) and to the Uwezo Fund app if you stayed signed in. Enter it here.', [
            '@email' => $masked,
          ]),
          'expires_in' => $expiry,
        ];
      }
      \Drupal::logger('api_auth')->warning('OTP email failed for @phone; attempting Uwezo Fund app delivery.', [
        '@phone' => $this->maskPhoneNumber($phone_number),
      ]);
      if ($this->notifyAppPushOtp($phone_number, $message, $resolved_email)) {
        $this->updateRateLimit($phone_number);
        $this->updateIpRateLimit();
        return [
          'success' => TRUE,
          'request_id' => $request_id,
          'delivery_channel' => 'app',
          'message' => $this->t('SMS and email were unavailable — we sent your login code to the Uwezo Fund app. Open the app (check Notifications) and enter the 6-digit code here.'),
          'expires_in' => $expiry,
        ];
      }
      $this->updateRateLimit($phone_number);
      $this->updateIpRateLimit();
      return [
        'success' => TRUE,
        'request_id' => $request_id,
        'delivery_channel' => 'app',
        'message' => $this->t('SMS and email were unavailable — we sent your login code to the Uwezo Fund app. Open the app (check Notifications) and enter the 6-digit code here.'),
        'expires_in' => $expiry,
      ];
    }

    if ($this->notifyAppPushOtp($phone_number, $message, $email) || $app_notified) {
      $this->updateRateLimit($phone_number);
      $this->updateIpRateLimit();
      return [
        'success' => TRUE,
        'request_id' => $request_id,
        'delivery_channel' => 'app',
        'message' => $this->t('SMS unavailable — we sent your login code to the Uwezo Fund app. Open the app (check Notifications) and enter the 6-digit code here.'),
        'expires_in' => $expiry,
      ];
    }

    // Keep the OTP so a late SMS or Uwezo Fund app notification can
    // still be entered.
    $this->updateRateLimit($phone_number);
    $this->updateIpRateLimit();
    return [
      'success' => TRUE,
      'request_id' => $request_id,
      'delivery_channel' => 'app',
      'message' => $this->t('We could not confirm SMS. If you stayed signed in on the Uwezo Fund app, open Notifications for the 6-digit code and enter it here.'),
      'expires_in' => $expiry,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function verifyOtp(string $request_id, string $otp_code): array {
    // Get OTP data from cache.
    $cache_data = $this->cache->get($this->getOtpCacheKey($request_id));

    if (!$cache_data || !$cache_data->data) {
      return [
        'success' => FALSE,
        'error' => $this->t('Invalid or expired verification code.'),
      ];
    }

    $otp_data = $cache_data->data;
    $config = $this->configFactory->get('api_auth.settings');
    $max_attempts = $config->get(self::CONFIG_OTP_MAX_ATTEMPTS) ?: 3;

    // Check attempt limit.
    if ($otp_data['attempts'] >= $max_attempts) {
      $this->cache->delete($this->getOtpCacheKey($request_id));

      return [
        'success' => FALSE,
        'error' => $this->t('Too many failed attempts. Please request a new code.'),
      ];
    }

    // Verify OTP code.
    if (!password_verify($otp_code, $otp_data['otp_code'])) {
      // Increment attempt count.
      ++$otp_data['attempts'];
      $this->cache->set(
        $this->getOtpCacheKey($request_id),
        $otp_data,
        $cache_data->expire,
        [self::CACHE_TAG_OTP]
      );

      return [
        'success' => FALSE,
        'error' => $this->t('Invalid verification code.'),
      ];
    }

    // OTP verified successfully - clean up cache.
    $this->cache->delete($this->getOtpCacheKey($request_id));

    try {
      // Find or create user.
      $user = $this->findOrCreateUserByPhone($otp_data['phone_number']);

      // Generate JWT tokens.
      $tokens = $this->jwtService->generateTokens($user);

      return [
        'success' => TRUE,
        'access_token' => $tokens['access_token'],
        'refresh_token' => $tokens['refresh_token'],
        'expires_in' => $this->jwtService->getAccessTokenExpiration(),
        'user' => [
          'uid' => (int) $user->id(),
          'phone_number' => $otp_data['phone_number'],
          'created' => $user->isNew(),
        ],
      ];
    }
    catch (\Exception $e) {
      return [
        'success' => FALSE,
        'error' => $e->getMessage(),
      ];
    }
  }

  /**
   * Public IP used for OTP location rate limiting.
   *
   * Website OTP is requested by Next.js over the Docker network. Drupal then
   * sees a private proxy IP for every login unless the browser IP is forwarded.
   */
  protected function getOtpClientIp(): string {
    $request = \Drupal::request();
    $forwarded = (string) ($request->headers->get('X-Forwarded-For')
      ?: $request->headers->get('X-Real-IP')
      ?: '');
    if ($forwarded !== '') {
      $candidate = trim(explode(',', $forwarded)[0]);
      if ($this->isPublicIp($candidate)) {
        return $candidate;
      }
    }
    return (string) $request->getClientIp();
  }

  /**
   * Whether an address is a public unicast IP (not private/reserved).
   */
  protected function isPublicIp(string $ip): bool {
    return (bool) filter_var(
      $ip,
      FILTER_VALIDATE_IP,
      FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    );
  }

  /**
   * Checks if IP address has exceeded rate limits.
   *
   * @return bool
   *   TRUE if within rate limits, FALSE if exceeded.
   */
  protected function checkIpRateLimit(): bool {
    $ip_address = $this->getOtpClientIp();
    // Never apply the location cap to private/proxy addresses. Otherwise every
    // site OTP request shares one Docker IP and hits the 20/hour bucket.
    if (!$this->isPublicIp($ip_address)) {
      return TRUE;
    }

    $config = $this->configFactory->get('api_auth.settings');
    $ip_rate_limit = $config->get(self::CONFIG_IP_RATE_LIMIT) ?: 20;
    $cache_key = 'otp_ip_rate_limit:' . hash('sha256', $ip_address);
    $cache_data = $this->cache->get($cache_key);

    if (!$cache_data) {
      return TRUE;
    }

    return $cache_data->data < $ip_rate_limit;
  }

  /**
   * Checks if a phone number has exceeded rate limits.
   *
   * @param string $phone_number
   *   The phone number to check.
   *
   * @return bool
   *   TRUE if within rate limits, FALSE if exceeded.
   */
  protected function checkRateLimit(string $phone_number): bool {
    $config = $this->configFactory->get('api_auth.settings');
    $rate_limit = $config->get(self::CONFIG_OTP_RATE_LIMIT) ?: 5;

    $cache_key = $this->getRateLimitCacheKey($phone_number);
    $cache_data = $this->cache->get($cache_key);

    if (!$cache_data) {
      return TRUE;
    }

    return $cache_data->data < $rate_limit;
  }

  /**
   * Generates a random OTP code.
   *
   * @return string
   *   The generated OTP code.
   */
  protected function generateOtpCode(): string {
    $config = $this->configFactory->get('api_auth.settings');
    $length = $config->get(self::CONFIG_OTP_LENGTH) ?: 6;

    $max = 10 ** $length - 1;
    $min = 10 ** ($length - 1);

    return (string) random_int($min, $max);
  }

  /**
   * Gets the cache key for an OTP request.
   *
   * @param string $request_id
   *   The request ID.
   *
   * @return string
   *   The cache key.
   */
  protected function getOtpCacheKey(string $request_id): string {
    return 'otp_auth:' . $request_id;
  }

  /**
   * Gets the cache key for rate limiting.
   *
   * @param string $phone_number
   *   The phone number.
   *
   * @return string
   *   The cache key.
   */
  protected function getRateLimitCacheKey(string $phone_number): string {
    return 'otp_rate_limit:' . hash('sha256', $phone_number);
  }

  /**
   * Masks a phone number for display.
   *
   * @param string $phone_number
   *   The phone number to mask.
   *
   * @return string
   *   The masked phone number.
   */
  protected function maskPhoneNumber(string $phone_number): string {
    if (\strlen($phone_number) < 4) {
      return str_repeat('*', \strlen($phone_number));
    }

    $visible_end = substr($phone_number, -4);
    $masked_start = str_repeat('*', \strlen($phone_number) - 4);

    return $masked_start . $visible_end;
  }

  /**
   * Masks an email for display (a***@domain).
   */
  protected function maskEmail(string $email): string {
    $email = trim($email);
    $at = strpos($email, '@');
    if ($at === FALSE || $at === 0) {
      return '***';
    }
    $local = substr($email, 0, $at);
    $domain = substr($email, $at + 1);
    $visible = substr($local, 0, 1);
    return $visible . '***@' . $domain;
  }

  /**
   * Normalizes and validates an email address.
   */
  protected function normalizeEmail(?string $email): ?string {
    $email = strtolower(trim((string) $email));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
      return NULL;
    }
    return $email;
  }

  /**
   * Finds the account email linked to a phone number, if any.
   */
  protected function findEmailForPhone(string $phone_number): ?string {
    $config = $this->configFactory->get('api_auth.settings');
    $phone_field = $config->get(self::CONFIG_PHONE_FIELD) ?: 'field_phone_number';
    $digits = preg_replace('/\D+/', '', $phone_number) ?: '';
    $variants = array_values(array_unique(array_filter([
      $phone_number,
      ltrim($phone_number, '+'),
      $digits !== '' ? '+' . $digits : NULL,
      $digits,
      (str_starts_with($digits, '254') && strlen($digits) === 12)
        ? ('0' . substr($digits, 3))
        : NULL,
    ])));

    $user_storage = $this->entityTypeManager->getStorage('user');
    foreach ($variants as $variant) {
      $uids = $user_storage->getQuery()
        ->condition($phone_field, $variant)
        ->condition('status', 1)
        ->accessCheck(FALSE)
        ->range(0, 1)
        ->execute();
      if (empty($uids)) {
        continue;
      }
      /** @var \Drupal\user\UserInterface|null $user */
      $user = $user_storage->load(reset($uids));
      if ($user) {
        $mail = $this->normalizeEmail($user->getEmail());
        if ($mail) {
          return $mail;
        }
      }
    }

    return NULL;
  }

  /**
   * Sends the OTP code by email via Drupal's mail system.
   *
   * Does not log the OTP code.
   */
  protected function sendOtpEmail(string $email, string $otp_code): bool {
    $params = [
      'subject' => 'Your Uwezo Fund login code',
      // Body built in hook_mail; code via params (not logged).
      'otp_code' => $otp_code,
    ];
    $result = $this->mailManager->mail(
      'api_auth',
      'otp_login',
      $email,
      'en',
      $params,
      NULL,
      TRUE
    );
    return !empty($result['result']);
  }

  /**
   * Checks if a phone number already exists for any user.
   *
   * @param string $phone_number
   *   The phone number to check.
   *
   * @return bool
   *   TRUE if phone number exists, FALSE otherwise.
   */
  protected function phoneNumberExists(string $phone_number): bool {
    $config = $this->configFactory->get('api_auth.settings');
    $phone_field = $config->get(self::CONFIG_PHONE_FIELD) ?: 'field_phone_number';

    $user_storage = $this->entityTypeManager->getStorage('user');
    $query = $user_storage->getQuery()
      ->condition($phone_field, $phone_number)
      ->accessCheck(FALSE)
      ->range(0, 1);

    $uids = $query->execute();

    return !empty($uids);
  }

  /**
   * Updates the IP rate limit counter.
   */
  protected function updateIpRateLimit(): void {
    $ip_address = $this->getOtpClientIp();
    if (!$this->isPublicIp($ip_address)) {
      return;
    }
    $cache_key = 'otp_ip_rate_limit:' . hash('sha256', $ip_address);
    $cache_data = $this->cache->get($cache_key);

    $count = $cache_data ? $cache_data->data + 1 : 1;

    // IP rate limit resets every hour.
    $this->cache->set(
      $cache_key,
      $count,
      time() + 3600,
      [self::CACHE_TAG_RATE_LIMIT]
    );
  }

  /**
   * Updates the rate limit counter for a phone number.
   *
   * @param string $phone_number
   *   The phone number.
   */
  protected function updateRateLimit(string $phone_number): void {
    $cache_key = $this->getRateLimitCacheKey($phone_number);
    $cache_data = $this->cache->get($cache_key);

    $count = $cache_data ? $cache_data->data + 1 : 1;

    // Rate limit resets every hour.
    $this->cache->set(
      $cache_key,
      $count,
      time() + 3600,
      [self::CACHE_TAG_RATE_LIMIT]
    );
  }

  /**
   * Checks if a username already exists.
   *
   * @param string $username
   *   The username to check.
   *
   * @return bool
   *   TRUE if username exists, FALSE otherwise.
   */
  protected function usernameExists(string $username): bool {
    $user_storage = $this->entityTypeManager->getStorage('user');
    $query = $user_storage->getQuery()
      ->condition('name', $username)
      ->accessCheck(FALSE)
      ->range(0, 1);

    $uids = $query->execute();

    return !empty($uids);
  }

  /**
   * Notify signed-in Uwezo Fund app (inbox/FCM).
   *
   * Returns TRUE when a device was targeted.
   */
  protected function notifyAppPushOtp(
    string $phone_number,
    string $message,
    ?string $email = NULL,
  ): bool {
    $secret = getenv('APP_PUSH_WEBHOOK_SECRET') ?: '';
    if ($secret === '') {
      return FALSE;
    }
    $urls = [];
    foreach ([getenv('APP_PUSH_NOTIFY_URL'), getenv('APP_PUSH_NOTIFY_URLS')] as $raw_urls) {
      if (!is_string($raw_urls) || $raw_urls === '') {
        continue;
      }
      foreach (explode(',', $raw_urls) as $candidate) {
        $candidate = trim($candidate);
        if ($candidate !== '') {
          $urls[] = $candidate;
        }
      }
    }
    // Loans prod, loans staging, and Majuu share the same mobile login.
    // Push the OTP into every app inbox that may be polling that number.
    foreach ([
      'http://prod-web:3000/api/auth/app/notify',
      'http://web:3000/api/auth/app/notify',
      'http://majuu-applicant-portal:3000/api/auth/app/notify',
    ] as $peer) {
      $urls[] = $peer;
    }
    if (!$urls) {
      $urls[] = 'http://web:3000/api/auth/app/notify';
    }
    $delivered = FALSE;
    foreach (array_values(array_unique($urls)) as $url) {
      try {
        $payload = json_encode([
          'kind' => 'otp',
          'title' => 'Uwezo Fund login code',
          'body' => $message,
          'phone' => $phone_number,
          'email' => $email,
        ]);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, TRUE);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
          'Content-Type: application/json',
          'Authorization: Bearer ' . $secret,
          'X-Uwezo-App-Push-Fanout: 1',
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code < 200 || $code >= 300 || !is_string($raw) || $raw === '') {
          continue;
        }
        $json = json_decode($raw, TRUE);
        if (!empty($json['delivered']) || (!empty($json['devices']) && (int) $json['devices'] > 0) || !empty($json['ok'])) {
          $delivered = TRUE;
        }
      }
      catch (\Throwable $e) {
        continue;
      }
    }
    return $delivered;
  }

}
