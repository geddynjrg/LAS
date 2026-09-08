<?php

namespace Drupal\api_application\Service;

use Drupal\Core\Database\Database;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\sms_providers\Service\SmsServiceInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Drupal\Component\Datetime\TimeInterface;

/**
 * Service for handling SMS confirmations for group members using Web database.
 */
class WebSmsConfirmationService {
  // phpcs:disable DrupalPractice.Objects.GlobalDrupal.GlobalDrupal

  /**
   * The SMS service.
   *
   * @var \Drupal\sms_providers\Service\SmsServiceInterface
   */
  protected $smsService;

  /**
   * The logger.
   *
   * @var \Psr\Log\LoggerInterface
   */
  protected $logger;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The time service.
   *
   * @var \Drupal\Component\Datetime\TimeInterface
   */
  protected $time;

  /**
   * The request stack.
   *
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  protected $requestStack;

  /**
   * Constructs a new WebSmsConfirmationService.
   */
  public function __construct(
    SmsServiceInterface $sms_service,
    LoggerChannelFactoryInterface $logger_factory,
    ConfigFactoryInterface $config_factory,
    TimeInterface $time,
    RequestStack $request_stack,
  ) {
    $this->smsService = $sms_service;
    $this->logger = $logger_factory->get('api_application');
    $this->configFactory = $config_factory;
    $this->time = $time;
    $this->requestStack = $request_stack;
  }

  /**
   * Send confirmation SMS to all members who have not confirmed.
   *
   * @param string $applicationId
   *   The application ID.
   *
   * @return array
   *   Array with 'success' and 'failed' counts.
   */
  public function sendConfirmationSmsToAllMembers($applicationId) {
    $db = $this->getWebDatabase();
    $results = ['success' => 0, 'failed' => 0];

    $this->logger->info('Starting SMS confirmation for all members of application @app', [
      '@app' => $applicationId,
    ]);

    try {
      // Get internal application ID
      // loger.
      $this->logger->info('Fetching internal application ID for application @app', [
        '@app' => $applicationId,
      ]);
      $internalAppId = $db->select('applications', 'a')
        ->fields('a', ['id'])
        ->condition('applicationId', $applicationId)
        ->range(0, 1)
        ->execute()
        ->fetchField();

      if (!$internalAppId) {
        $this->logger->error('Could not find internal application ID for: @app', ['@app' => $applicationId]);
        $results['failed']++;
        return $results;
      }
      // Get all members who require confirmation and haven't responded yet.
      $query = $db->select('member_data', 'm')
        ->fields('m')
      // Use internal ID.
        ->condition('applicationId', $internalAppId)
        ->condition('requiresConfirmation', 1)
        ->condition('phoneNumber', '', '<>')
        ->isNotNull('phoneNumber');

      // Members who haven't confirmed or declined.
      $statusGroup = $query->orConditionGroup()
        ->condition('confirmation_status', 'pending')
        ->condition('confirmation_status', 'sent')
        ->condition('confirmation_status', 'failed')
        ->isNull('confirmation_status');

      $query->condition($statusGroup);

      $members = $query->execute()->fetchAll();

      if (empty($members)) {
        $this->logger->info('No members found requiring confirmation for application @app', [
          '@app' => $applicationId,
        ]);
        return $results;
      }

      $this->logger->info('Found @count members requiring confirmation for application @app', [
        '@count' => count($members),
        '@app' => $applicationId,
      ]);

      foreach ($members as $member) {
        $memberData = (array) $member;

        if ($this->sendConfirmationSmsToMember($internalAppId, $memberData)) {
          $results['success']++;
        }
        else {
          $results['failed']++;
        }
      }

      $this->logger->info('SMS confirmation completed for @app: @success success, @failed failed', [
        '@app' => $applicationId,
        '@success' => $results['success'],
        '@failed' => $results['failed'],
      ]);

    }
    catch (\Exception $e) {
      $this->logger->error('Error sending confirmations to all members: @error', [
        '@error' => $e->getMessage(),
      ]);
    }

    return $results;
  }

  /**
   * Send confirmation SMS to a specific member.
   *
   * @param string $applicationId
   *   The application ID.
   * @param array $member
   *   Member data.
   *
   * @return bool
   *   TRUE if SMS was sent successfully, FALSE otherwise.
   */
  public function sendConfirmationSmsToMember($applicationId, array $member) {
    $db = $this->getWebDatabase();

    try {
      // Skip if no phone number.
      if (empty($member['phoneNumber'])) {
        $this->logger->warning('Cannot send SMS to @name - no phone number', [
          '@name' => $member['fullname'] ?? 'Unknown',
        ]);
        return FALSE;
      }

      // Generate unique token.
      $token = bin2hex(random_bytes(32));
      $currentTime = date('Y-m-d H:i:s');

      // Set token expiration (7 days from now)
      $tokenExpiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

      // Update member with token in Web database.
      $db->update('member_data')
        ->fields([
          'confirmation_token' => $token,
          'confirmation_status' => 'sent',
          'confirmation_sent_at' => $currentTime,
          'confirmation_token_expires_at' => $tokenExpiresAt,
          'updatedAt' => $currentTime,
        ])
        ->condition('id', $member['id'])
        ->condition('applicationId', $applicationId)
        ->execute();

      // Generate confirmation URL.
      $confirmationUrl = $this->generateConfirmationUrl($token);

      // Build SMS message.
      $message = $this->buildConfirmationMessage($member, $confirmationUrl);

      // Send SMS.
      $smsResult = $this->smsService->sendSms($member['phoneNumber'], $message);

      if ($this->isSmsSendSuccessful($smsResult)) {
        $this->logger->info('SMS sent successfully to @name (@phone)', [
          '@name' => $member['fullname'],
          '@phone' => $member['phoneNumber'],
        ]);
        return TRUE;
      }
      else {
        // Update status to failed.
        $db->update('member_data')
          ->fields([
            'confirmation_status' => 'failed',
            'updatedAt' => $currentTime,
          ])
          ->condition('id', $member['id'])
          ->execute();

        $this->logger->error('Failed to send SMS to @name (@phone)', [
          '@name' => $member['fullname'],
          '@phone' => $member['phoneNumber'],
        ]);
        return FALSE;
      }

    }
    catch (\Exception $e) {
      $this->logger->error('Exception sending SMS to @name: @error', [
        '@name' => $member['fullname'] ?? 'Unknown',
        '@error' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * Send confirmation SMS to specific members (from frontend data).
   *
   * @param string $applicationId
   *   The application ID.
   * @param array $membersData
   *   Array of member data from frontend.
   *
   * @return array
   *   Array with 'success' and 'failed' counts.
   */
  public function sendConfirmationSmsToMembers($applicationId, array $membersData) {
    $results = ['success' => 0, 'failed' => 0];

    $this->logger->info('Starting SMS confirmation for application @app with @count specific members', [
      '@app' => $applicationId,
      '@count' => count($membersData),
    ]);

    foreach ($membersData as $member) {
      // Skip members without phone numbers or who don't require confirmation.
      if (empty($member['phoneNumber']) || ($member['requiresConfirmation'] ?? TRUE) === FALSE) {
        $this->logger->info('Skipping member @name - no phone number or confirmation not required', [
          '@name' => $member['fullname'] ?? 'Unknown',
        ]);
        continue;
      }

      if ($this->sendConfirmationSmsToMember($applicationId, $member)) {
        $results['success']++;
      }
      else {
        $results['failed']++;
      }
    }

    $this->logger->info('SMS confirmation completed for @app: @success success, @failed failed', [
      '@app' => $applicationId,
      '@success' => $results['success'],
      '@failed' => $results['failed'],
    ]);

    return $results;
  }

  /**
   * Process member confirmation or decline via token.
   *
   * @param string $token
   *   The confirmation token.
   * @param string $action
   *   The action: 'confirmed' or 'declined'.
   *
   * @return array|null
   *   Member data if found, NULL otherwise.
   */
  public function processMemberResponse($token, $action) {
    if (!in_array($action, ['confirmed', 'declined'])) {
      $this->logger->error('Invalid action for member response: @action', ['@action' => $action]);
      return NULL;
    }

    $db = $this->getWebDatabase();

    try {
      // Find member by token and check expiration.
      $query = $db->select('member_data', 'm')
        ->fields('m')
        ->condition('confirmation_token', $token);

      // Token valid if expiration is in the future or null.
      $group = $query->orConditionGroup()
        ->condition('confirmation_token_expires_at', date('Y-m-d H:i:s'), '>')
        ->isNull('confirmation_token_expires_at');

      $query->condition($group);
      $query->range(0, 1);

      $member = $query->execute()->fetchAssoc();

      if (!$member) {
        $this->logger->warning('Invalid or expired confirmation token used: @token', ['@token' => $token]);
        return NULL;
      }

      // Check if token is expired (additional check for safety)
      if (!empty($member['confirmation_token_expires_at']) &&
            $member['confirmation_token_expires_at'] < date('Y-m-d H:i:s')) {
        $this->logger->warning('Expired confirmation token used: @token', ['@token' => $token]);
        return NULL;
      }

      // Check if already processed.
      if ($member['confirmation_status'] === $action) {
        $this->logger->info('Member @name already @action', [
          '@name' => $member['fullname'],
          '@action' => $action,
        ]);
        return $member;
      }

      // Update member status.
      $currentTime = date('Y-m-d H:i:s');
      $db->update('member_data')
        ->fields([
          'status' => 'CONFIRMED',
          'confirmation_status' => $action,
          'confirmation_confirmed_at' => $currentTime,
          'updatedAt' => $currentTime,
        ])
        ->condition('id', $member['id'])
        ->execute();

      $this->logger->info('Member @name @action participation via SMS token', [
        '@name' => $member['fullname'],
        '@action' => $action,
      ]);

      $this->logger->info('Checking application status for application ID: @app', [
        '@app' => $member['applicationId'],
      ]);
      // Check if application should be updated
      // $this->checkApplicationStatus($member['applicationId']);.
      return $member;

    }
    catch (\Exception $e) {
      $this->logger->error('Error processing member response: @error', ['@error' => $e->getMessage()]);
      return NULL;
    }
  }

  /**
   * Confirm a member using their token.
   *
   * @param string $token
   *   The confirmation token.
   *
   * @return array|null
   *   Member data if confirmed, NULL otherwise.
   */
  public function confirmMember($token) {
    return $this->processMemberResponse($token, 'confirmed');
  }

  /**
   * Decline a member using their token.
   *
   * @param string $token
   *   The confirmation token.
   *
   * @return array|null
   *   Member data if declined, NULL otherwise.
   */
  public function declineMember($token) {
    return $this->processMemberResponse($token, 'declined');
  }

  /**
   * Check if application status should be updated based on member responses.
   *
   * @param string $applicationId
   *   The application ID.
   */
  protected function checkApplicationStatus($applicationId) {
    $db = $this->getWebDatabase();

    try {
      // Get all members for this application.
      $members = $db->select('member_data', 'm')
        ->fields('m', ['id', 'confirmation_status', 'requiresConfirmation'])
        ->condition('applicationId', $applicationId)
        ->execute()
        ->fetchAll();

      // Count responses.
      $totalRequired = 0;
      $confirmedCount = 0;

      foreach ($members as $member) {
        if ($member->requiresConfirmation) {
          $totalRequired++;
          if ($member->confirmation_status === 'confirmed') {
            $confirmedCount++;
          }
        }
      }

      // If no members require confirmation, nothing to do.
      if ($totalRequired === 0) {
        return;
      }

      // Calculate approval percentage.
      $approvalPercentage = ($confirmedCount / $totalRequired) * 100;

      // If 75% or more confirmed, update application status.
      if ($approvalPercentage >= 75) {
        $this->logger->notice('Application @id transitioned to SUBMITTED (@count/@total = @percentage% confirmed)', [
          '@id' => $applicationId,
          '@count' => $confirmedCount,
          '@total' => $totalRequired,
          '@percentage' => round($approvalPercentage, 1),
        ]);
      }
      else {
        $this->logger->info('Application @id needs more confirmations (@count/@total = @percentage%, need 75%)', [
          '@id' => $applicationId,
          '@count' => $confirmedCount,
          '@total' => $totalRequired,
          '@percentage' => round($approvalPercentage, 1),
        ]);
      }

    }
    catch (\Exception $e) {
      $this->logger->error('Error checking application status: @error', ['@error' => $e->getMessage()]);
    }
  }

  /**
   * Generate confirmation URL.
   *
   * @param string $token
   *   The confirmation token.
   *
   * @return string
   *   The confirmation URL.
   */
  protected function generateConfirmationUrl($token) {
    $config = $this->configFactory->get('api_application.settings');
    $frontendBaseUrl = $config->get('frontend_base_url');

    if (!$frontendBaseUrl) {
      // Fallback to API endpoint if no frontend URL configured.
      $request = $this->requestStack->getCurrentRequest();
      $baseUrl = $request ? $request->getSchemeAndHttpHost() : '';
      return $baseUrl . '/api/v1/member/response/' . $token;
    }

    // Get the confirmation path template, default to '/confirm/{token}'.
    $confirmationPath = $config->get('frontend_confirmation_path') ?? '/confirm/{token}';

    // Replace the {token} placeholder with the actual token.
    $path = str_replace('{token}', $token, $confirmationPath);

    // Ensure the path starts with a slash.
    if (strpos($path, '/') !== 0) {
      $path = '/' . $path;
    }

    return rtrim($frontendBaseUrl, '/') . $path;
  }

  /**
   * Build confirmation SMS message.
   *
   * @param array $member
   *   Member data.
   * @param string $confirmationUrl
   *   The confirmation URL.
   *
   * @return string
   *   The SMS message.
   */
  protected function buildConfirmationMessage($member, $confirmationUrl) {
    $config = $this->configFactory->get('api_application.settings');
    $customMessage = $config->get('sms_confirmation_message');

    $memberName = $member['fullname'] ?? 'Member';

    if (!empty($customMessage)) {
      return str_replace(
        ['[member:name]', '[confirmation:url]'],
        [$memberName, $confirmationUrl],
        $customMessage
      );
    }

    // Default message.
    return "Hello {$memberName}, please confirm your participation in your group loan application by clicking: {$confirmationUrl}";
  }

  /**
   * Send submission-success SMS to all group members with phone numbers.
   *
   * @param string $applicationId
   *   The public application ID (e.g. APP-20260525-3MLREI).
   *
   * @return array
   *   Array with 'success', 'failed', and optional 'disabled' keys.
   */
  public function sendSubmissionSuccessSmsToAllMembers($applicationId) {
    $config = $this->configFactory->get('api_application.settings');
    $results = ['success' => 0, 'failed' => 0];

    if (!$config->get('sms_submission_success_enabled')) {
      $this->logger->info('Submission success SMS disabled for application @app', [
        '@app' => $applicationId,
      ]);
      $results['disabled'] = TRUE;
      return $results;
    }

    $db = $this->getWebDatabase();

    try {
      $internalAppId = $db->select('applications', 'a')
        ->fields('a', ['id'])
        ->condition('applicationId', $applicationId)
        ->range(0, 1)
        ->execute()
        ->fetchField();

      if (!$internalAppId) {
        $this->logger->error('Could not find internal application ID for: @app', [
          '@app' => $applicationId,
        ]);
        $results['failed']++;
        return $results;
      }

      $groupName = $db->select('group_data', 'g')
        ->fields('g', ['groupName'])
        ->condition('applicationId', $internalAppId)
        ->range(0, 1)
        ->execute()
        ->fetchField() ?: 'your group';

      $members = $db->select('member_data', 'm')
        ->fields('m')
        ->condition('applicationId', $internalAppId)
        ->condition('phoneNumber', '', '<>')
        ->isNotNull('phoneNumber')
        ->execute()
        ->fetchAll();

      if (empty($members)) {
        $this->logger->info('No members with phone numbers for submission SMS on @app', [
          '@app' => $applicationId,
        ]);
        return $results;
      }

      $this->logger->info('Sending submission success SMS to @count members for @app', [
        '@count' => count($members),
        '@app' => $applicationId,
      ]);

      foreach ($members as $member) {
        if ($this->sendSubmissionSuccessSmsToMember(
          (array) $member,
          $applicationId,
          $groupName
        )) {
          $results['success']++;
        }
        else {
          $results['failed']++;
        }
      }

      $this->logger->info('Submission success SMS completed for @app: @success sent, @failed failed', [
        '@app' => $applicationId,
        '@success' => $results['success'],
        '@failed' => $results['failed'],
      ]);
    }
    catch (\Exception $e) {
      $this->logger->error('Error sending submission success SMS: @error', [
        '@error' => $e->getMessage(),
      ]);
    }

    return $results;
  }

  /**
   * Send submission-success SMS to a single member.
   */
  protected function sendSubmissionSuccessSmsToMember(
    array $member,
    string $applicationId,
    string $groupName,
  ): bool {
    try {
      if (empty($member['phoneNumber'])) {
        $this->logger->warning('Cannot send submission SMS to @name - no phone number', [
          '@name' => $member['fullname'] ?? 'Unknown',
        ]);
        return FALSE;
      }

      $message = $this->buildSubmissionSuccessMessage($member, $applicationId, $groupName);
      $smsResult = $this->smsService->sendSms($member['phoneNumber'], $message);

      if ($this->isSmsSendSuccessful($smsResult)) {
        $this->logger->info('Submission success SMS sent to @name (@phone)', [
          '@name' => $member['fullname'] ?? 'Member',
          '@phone' => $member['phoneNumber'],
        ]);
        return TRUE;
      }

      $this->logger->error('Failed to send submission success SMS to @name (@phone)', [
        '@name' => $member['fullname'] ?? 'Member',
        '@phone' => $member['phoneNumber'],
      ]);
      return FALSE;
    }
    catch (\Exception $e) {
      $this->logger->error('Exception sending submission success SMS to @name: @error', [
        '@name' => $member['fullname'] ?? 'Unknown',
        '@error' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * Build submission-success SMS message.
   */
  protected function buildSubmissionSuccessMessage(
    array $member,
    string $applicationId,
    string $groupName,
  ): string {
    $config = $this->configFactory->get('api_application.settings');
    $customMessage = $config->get('sms_submission_success_message');
    $memberName = $member['fullname'] ?? 'Member';

    if (!empty($customMessage)) {
      return str_replace(
        ['[member:name]', '[application:id]', '[application:group_name]'],
        [$memberName, $applicationId, $groupName],
        $customMessage
      );
    }

    return "Hello {$memberName}, your group ({$groupName}) loan application {$applicationId} has been submitted successfully and is now under review.";
  }

  /**
   * Send payment-success SMS to all group members with phone numbers.
   *
   * @param string $applicationId
   *   Public application ID.
   * @param string $amount
   *   Formatted payment amount (e.g. 20.00).
   * @param string $billRefNumber
   *   Pesaflow bill reference, if available.
   *
   * @return array
   *   Array with 'success', 'failed', and optional 'disabled' keys.
   */
  public function sendPaymentSuccessSmsToAllMembers(
    $applicationId,
    $amount = '0.00',
    $billRefNumber = '',
  ) {
    $config = $this->configFactory->get('api_application.settings');
    $results = ['success' => 0, 'failed' => 0];

    if (!$config->get('sms_payment_success_enabled')) {
      $this->logger->info('Payment success SMS disabled for application @app', [
        '@app' => $applicationId,
      ]);
      $results['disabled'] = TRUE;
      return $results;
    }

    $db = $this->getWebDatabase();

    try {
      $internalAppId = $db->select('applications', 'a')
        ->fields('a', ['id'])
        ->condition('applicationId', $applicationId)
        ->range(0, 1)
        ->execute()
        ->fetchField();

      if (!$internalAppId) {
        $this->logger->error('Could not find internal application ID for payment SMS: @app', [
          '@app' => $applicationId,
        ]);
        $results['failed']++;
        return $results;
      }

      $groupName = $db->select('group_data', 'g')
        ->fields('g', ['groupName'])
        ->condition('applicationId', $internalAppId)
        ->range(0, 1)
        ->execute()
        ->fetchField() ?: 'your group';

      $members = $db->select('member_data', 'm')
        ->fields('m')
        ->condition('applicationId', $internalAppId)
        ->condition('phoneNumber', '', '<>')
        ->isNotNull('phoneNumber')
        ->execute()
        ->fetchAll();

      if (empty($members)) {
        $this->logger->info('No members with phone numbers for payment SMS on @app', [
          '@app' => $applicationId,
        ]);
        return $results;
      }

      $formattedAmount = number_format((float) $amount, 2, '.', '');

      $this->logger->info('Sending payment success SMS to @count members for @app (KES @amount)', [
        '@count' => count($members),
        '@app' => $applicationId,
        '@amount' => $formattedAmount,
      ]);

      foreach ($members as $member) {
        if ($this->sendPaymentSuccessSmsToMember(
          (array) $member,
          $applicationId,
          $groupName,
          $formattedAmount,
          $billRefNumber
        )) {
          $results['success']++;
        }
        else {
          $results['failed']++;
        }
      }

      $this->logger->info('Payment success SMS completed for @app: @success sent, @failed failed', [
        '@app' => $applicationId,
        '@success' => $results['success'],
        '@failed' => $results['failed'],
      ]);
    }
    catch (\Exception $e) {
      $this->logger->error('Error sending payment success SMS: @error', [
        '@error' => $e->getMessage(),
      ]);
    }

    return $results;
  }

  /**
   * Send payment-success SMS to a single member.
   */
  protected function sendPaymentSuccessSmsToMember(
    array $member,
    string $applicationId,
    string $groupName,
    string $amount,
    string $billRefNumber,
  ): bool {
    try {
      if (empty($member['phoneNumber'])) {
        return FALSE;
      }

      $message = $this->buildPaymentSuccessMessage(
        $member,
        $applicationId,
        $groupName,
        $amount,
        $billRefNumber
      );
      $smsResult = $this->smsService->sendSms($member['phoneNumber'], $message);

      if ($this->isSmsSendSuccessful($smsResult)) {
        $this->logger->info('Payment success SMS sent to @name (@phone)', [
          '@name' => $member['fullname'] ?? 'Member',
          '@phone' => $member['phoneNumber'],
        ]);
        return TRUE;
      }

      $this->logger->error('Failed to send payment success SMS to @name (@phone)', [
        '@name' => $member['fullname'] ?? 'Member',
        '@phone' => $member['phoneNumber'],
      ]);
      return FALSE;
    }
    catch (\Exception $e) {
      $this->logger->error('Exception sending payment success SMS to @name: @error', [
        '@name' => $member['fullname'] ?? 'Unknown',
        '@error' => $e->getMessage(),
      ]);
      return FALSE;
    }
  }

  /**
   * Build payment-success SMS message.
   */
  protected function buildPaymentSuccessMessage(
    array $member,
    string $applicationId,
    string $groupName,
    string $amount,
    string $billRefNumber,
  ): string {
    $config = $this->configFactory->get('api_application.settings');
    $customMessage = $config->get('sms_payment_success_message');
    $memberName = $member['fullname'] ?? 'Member';
    $reference = $billRefNumber ?: $applicationId;

    if (!empty($customMessage)) {
      return str_replace(
        [
          '[member:name]',
          '[application:id]',
          '[application:group_name]',
          '[payment:amount]',
          '[payment:reference]',
        ],
        [$memberName, $applicationId, $groupName, $amount, $reference],
        $customMessage
      );
    }

    return "Hello {$memberName}, payment of KES {$amount} for {$groupName} loan ({$applicationId}) was received successfully. Ref: {$reference}.";
  }

  /**
   * Determine whether an SMS provider response indicates success.
   */
  protected function isSmsSendSuccessful($smsResult): bool {
    if (is_array($smsResult)) {
      return !empty($smsResult['success']);
    }

    return (bool) $smsResult;
  }

  /**
   * Get Web database connection.
   *
   * @return \Drupal\Core\Database\Connection
   *   Database connection.
   */
  protected function getWebDatabase() {
    return Database::getConnection('default', 'web');
  }

  /**
   * Get confirmation statistics for an application.
   *
   * @param string $applicationId
   *   The application ID.
   *
   * @return array
   *   Confirmation statistics.
   */
  public function getConfirmationStats($applicationId) {
    $db = $this->getWebDatabase();

    $stats = [
      'total' => 0,
      'pending' => 0,
      'sent' => 0,
      'confirmed' => 0,
      'declined' => 0,
      'failed' => 0,
    ];

    try {
      $members = $db->select('member_data', 'm')
        ->fields('m', ['confirmation_status', 'requiresConfirmation'])
        ->condition('applicationId', $applicationId)
        ->execute()
        ->fetchAll();

      foreach ($members as $member) {
        if ($member->requiresConfirmation) {
          $stats['total']++;
          $status = $member->confirmation_status;
          if (isset($stats[$status])) {
            $stats[$status]++;
          }
        }
      }

    }
    catch (\Exception $e) {
      $this->logger->error('Error getting confirmation stats: @error', ['@error' => $e->getMessage()]);
    }

    return $stats;
  }

  /**
   * Resend confirmation SMS to members who haven't responded.
   *
   * @param string $applicationId
   *   The application ID.
   *
   * @return array
   *   Array with 'success' and 'failed' counts.
   */
  public function resendPendingConfirmations($applicationId) {
    $db = $this->getWebDatabase();
    $results = ['success' => 0, 'failed' => 0];

    try {
      // Get members who haven't confirmed or declined.
      $query = $db->select('member_data', 'm')
        ->fields('m')
        ->condition('applicationId', $applicationId)
        ->condition('requiresConfirmation', 1);

      $statusGroup = $query->orConditionGroup()
        ->condition('confirmation_status', 'pending')
        ->condition('confirmation_status', 'sent')
        ->condition('confirmation_status', 'failed')
        ->isNull('confirmation_status');

      $query->condition($statusGroup);

      $members = $query->execute()->fetchAll();

      foreach ($members as $member) {
        $memberData = (array) $member;

        if ($this->sendConfirmationSmsToMember($applicationId, $memberData)) {
          $results['success']++;
        }
        else {
          $results['failed']++;
        }
      }

      $this->logger->info('Resent SMS confirmations for @app: @success success, @failed failed', [
        '@app' => $applicationId,
        '@success' => $results['success'],
        '@failed' => $results['failed'],
      ]);

    }
    catch (\Exception $e) {
      $this->logger->error('Error resending confirmations: @error', ['@error' => $e->getMessage()]);
    }

    return $results;
  }

  /**
   * Resolve the internal web application ID from the public application ID.
   */
  protected function resolveInternalApplicationId(string $applicationId): ?string {
    $db = $this->getWebDatabase();

    $internalAppId = $db->select('applications', 'a')
      ->fields('a', ['id'])
      ->condition('applicationId', $applicationId)
      ->range(0, 1)
      ->execute()
      ->fetchField();

    return $internalAppId ?: NULL;
  }

  /**
   * OTP lifetime in seconds.
   */
  protected const MEMBER_OTP_TTL = 900;

  /**
   * Maximum verify attempts per OTP.
   */
  protected const MEMBER_OTP_MAX_ATTEMPTS = 5;

  /**
   * Load a member requiring confirmation by national ID or phone.
   */
  protected function loadMemberForOtp(string $applicationId, string $nationalIdCode): ?array {
    $internalAppId = $this->resolveInternalApplicationId($applicationId);
    if (!$internalAppId) {
      return NULL;
    }

    $lookup = preg_replace('/\s+/', '', trim($nationalIdCode));
    $db = $this->getWebDatabase();

    $member = $db->select('member_data', 'm')
      ->fields('m')
      ->condition('applicationId', $internalAppId)
      ->condition('nationalIdCode', $lookup)
      ->range(0, 1)
      ->execute()
      ->fetchAssoc();

    if ($member) {
      return $member;
    }

    $members = $db->select('member_data', 'm')
      ->fields('m')
      ->condition('applicationId', $internalAppId)
      ->execute()
      ->fetchAll(\PDO::FETCH_ASSOC);

    $lookupDigits = preg_replace('/\D+/', '', $lookup);
    foreach ($members as $row) {
      $rowId = preg_replace('/\s+/', '', (string) ($row['nationalIdCode'] ?? ''));
      $rowPhone = preg_replace('/\D+/', '', (string) ($row['phoneNumber'] ?? ''));
      if ($rowId === $lookup || ($lookupDigits !== '' && $rowPhone !== '' && $rowPhone === $lookupDigits)) {
        return $row;
      }
    }

    return NULL;
  }

  /**
   * Build cache key for member confirmation OTP.
   */
  protected function getMemberOtpCacheKey(string $applicationId, string $memberId): string {
    return 'member_confirmation_otp:' . $applicationId . ':' . $memberId;
  }

  /**
   * Generate a 6-digit OTP code.
   */
  protected function generateMemberOtpCode(): string {
    return (string) random_int(100000, 999999);
  }

  /**
   * Persist OTP hash in the web database so it survives Redis/cache eviction.
   */
  protected function persistMemberOtp(string $applicationId, array $member, string $otpHash, int $attempts = 0): void {
    $now = $this->time->getCurrentTime();
    $ttl = self::MEMBER_OTP_TTL;
    $nowSql = date('Y-m-d H:i:s', $now);
    $expiresSql = date('Y-m-d H:i:s', $now + $ttl);

    try {
      $this->getWebDatabase()->update('member_data')
        ->fields([
          'confirmation_token' => $otpHash,
          'confirmation_token_expires_at' => $expiresSql,
          'confirmation_status' => 'sent',
          'confirmation_sent_at' => $nowSql,
          'updatedAt' => $nowSql,
        ])
        ->condition('id', $member['id'])
        ->execute();
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to persist member OTP hash for member @id: @error', [
        '@id' => $member['id'] ?? 'unknown',
        '@error' => $e->getMessage(),
      ]);
      throw $e;
    }

    \Drupal::cache('default')->set(
      $this->getMemberOtpCacheKey($applicationId, (string) $member['id']),
      [
        'otp_hash' => $otpHash,
        'attempts' => $attempts,
        'created' => $now,
        'member_id' => $member['id'],
        'expires' => $now + $ttl,
      ],
      $now + $ttl
    );
  }

  /**
   * Load a still-valid OTP hash for a member (database first, cache fallback).
   */
  protected function loadStoredMemberOtp(string $applicationId, array $member): ?array {
    $now = $this->time->getCurrentTime();
    $fresh = $this->getWebDatabase()->select('member_data', 'm')
      ->fields('m', ['confirmation_token', 'confirmation_token_expires_at'])
      ->condition('id', $member['id'])
      ->range(0, 1)
      ->execute()
      ->fetchAssoc();
    if ($fresh) {
      $member['confirmation_token'] = $fresh['confirmation_token'];
      $member['confirmation_token_expires_at'] = $fresh['confirmation_token_expires_at'];
    }
    $hash = (string) ($member['confirmation_token'] ?? '');
    $expiresAt = $member['confirmation_token_expires_at'] ?? NULL;

    if ($hash !== '' && str_starts_with($hash, '$2') && !empty($expiresAt)) {
      $expiresTs = strtotime((string) $expiresAt);
      if ($expiresTs !== FALSE && $expiresTs >= $now) {
        $cache = \Drupal::cache('default')->get(
          $this->getMemberOtpCacheKey($applicationId, (string) $member['id'])
        );
        $attempts = 0;
        if (is_object($cache) && isset($cache->data['attempts'])) {
          $attempts = (int) $cache->data['attempts'];
        }
        return [
          'otp_hash' => $hash,
          'attempts' => $attempts,
          'expires' => $expiresTs,
        ];
      }
    }

    $cached = \Drupal::cache('default')->get(
      $this->getMemberOtpCacheKey($applicationId, (string) $member['id'])
    );
    if ($cached && !empty($cached->data['otp_hash'])) {
      $expires = (int) ($cached->data['expires'] ?? $cached->expire ?? 0);
      if ($expires >= $now || $cached->expire >= $now) {
        return [
          'otp_hash' => $cached->data['otp_hash'],
          'attempts' => (int) ($cached->data['attempts'] ?? 0),
          'expires' => $expires ?: (int) $cached->expire,
        ];
      }
    }

    return NULL;
  }

  /**
   * Send a 6-digit OTP to a member for confirmation.
   */
  public function sendConfirmationOtpToMember(string $applicationId, string $nationalIdCode): array {
    $member = $this->loadMemberForOtp($applicationId, $nationalIdCode);

    if (!$member) {
      return [
        'success' => FALSE,
        'message' => 'Member not found for this application.',
      ];
    }

    if (empty($member['requiresConfirmation'])) {
      return [
        'success' => FALSE,
        'message' => 'This member does not require confirmation.',
      ];
    }

    if (empty($member['phoneNumber'])) {
      return [
        'success' => FALSE,
        'message' => 'Member has no phone number on record.',
      ];
    }

    if (in_array($member['confirmation_status'], ['confirmed', 'declined'], TRUE)) {
      return [
        'success' => FALSE,
        'message' => 'Member has already responded.',
        'confirmation_status' => $member['confirmation_status'],
      ];
    }

    $otpCode = $this->generateMemberOtpCode();
    $otpHash = password_hash($otpCode, PASSWORD_BCRYPT);
    $this->persistMemberOtp($applicationId, $member, $otpHash);

    $memberName = $member['fullname'] ?? 'Member';
    $ttlMinutes = (int) (self::MEMBER_OTP_TTL / 60);
    $message = "Hello {$memberName}, your Uwezo Fund member confirmation code is: {$otpCode}. Valid for {$ttlMinutes} minutes.";

    $smsResult = ['success' => FALSE];
    try {
      $smsResult = $this->smsService->sendSms($member['phoneNumber'], $message);
    }
    catch (\Exception $e) {
      $this->logger->error('OTP SMS exception for @name (@phone): @error', [
        '@name' => $memberName,
        '@phone' => $member['phoneNumber'],
        '@error' => $e->getMessage(),
      ]);
    }
    if (!$this->isSmsSendSuccessful($smsResult)) {
      // Keep the stored OTP. EBIS often delivers even when the HTTP
      // response is missing status 1000; deleting the code made a delivered
      // SMS look expired on every application.
      $this->logger->warning('OTP SMS provider reported failure for @name (@phone); code is still valid until @expiry.', [
        '@name' => $memberName,
        '@phone' => $member['phoneNumber'],
        '@expiry' => date('Y-m-d H:i:s', $this->time->getCurrentTime() + self::MEMBER_OTP_TTL),
      ]);
    }

    return [
      'success' => TRUE,
      'message' => 'OTP sent successfully. Enter the 6-digit code from SMS.',
      'expires_in' => self::MEMBER_OTP_TTL,
      'member' => [
        'national_id_code' => $member['nationalIdCode'],
        'confirmation_status' => 'sent',
      ],
    ];
  }

  /**
   * Verify a member confirmation OTP.
   */
  public function verifyConfirmationOtp(string $applicationId, string $nationalIdCode, string $otpCode): array {
    $member = $this->loadMemberForOtp($applicationId, $nationalIdCode);

    if (!$member) {
      return [
        'success' => FALSE,
        'message' => 'Member not found for this application.',
      ];
    }

    if (in_array($member['confirmation_status'], ['confirmed', 'declined'], TRUE)) {
      return [
        'success' => TRUE,
        'message' => 'Member has already responded.',
        'already_responded' => TRUE,
        'member' => [
          'national_id_code' => $member['nationalIdCode'],
          'confirmation_status' => $member['confirmation_status'],
        ],
      ];
    }

    $otpCode = preg_replace('/\D+/', '', (string) $otpCode);
    $otpData = $this->loadStoredMemberOtp($applicationId, $member);
    if (!$otpData) {
      return [
        'success' => FALSE,
        'message' => 'OTP expired or not sent. Please request a new code.',
      ];
    }

    $attempts = (int) ($otpData['attempts'] ?? 0);
    if ($attempts >= self::MEMBER_OTP_MAX_ATTEMPTS) {
      return [
        'success' => FALSE,
        'message' => 'Too many invalid attempts. Please request a new OTP.',
      ];
    }

    if ($otpCode === '' || !password_verify($otpCode, $otpData['otp_hash'])) {
      $attempts++;
      \Drupal::cache('default')->set(
        $this->getMemberOtpCacheKey($applicationId, (string) $member['id']),
        [
          'otp_hash' => $otpData['otp_hash'],
          'attempts' => $attempts,
          'created' => $this->time->getCurrentTime(),
          'member_id' => $member['id'],
          'expires' => $otpData['expires'],
        ],
        (int) $otpData['expires']
      );
      return [
        'success' => FALSE,
        'message' => 'Invalid OTP code.',
        'attempts_remaining' => max(0, self::MEMBER_OTP_MAX_ATTEMPTS - $attempts),
      ];
    }

    $currentTime = date('Y-m-d H:i:s', $this->time->getCurrentTime());
    $this->getWebDatabase()->update('member_data')
      ->fields([
        'status' => 'CONFIRMED',
        'confirmation_status' => 'confirmed',
        'confirmation_confirmed_at' => $currentTime,
        'confirmation_token' => NULL,
        'confirmation_token_expires_at' => NULL,
        'updatedAt' => $currentTime,
      ])
      ->condition('id', $member['id'])
      ->execute();

    \Drupal::cache('default')->delete(
      $this->getMemberOtpCacheKey($applicationId, (string) $member['id'])
    );

    return [
      'success' => TRUE,
      'message' => 'Member confirmed successfully.',
      'member' => [
        'national_id_code' => $member['nationalIdCode'],
        'confirmation_status' => 'confirmed',
      ],
    ];
  }

}

// phpcs:enable DrupalPractice.Objects.GlobalDrupal.GlobalDrupal
