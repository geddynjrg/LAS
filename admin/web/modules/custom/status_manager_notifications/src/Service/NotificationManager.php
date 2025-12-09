<?php

namespace Drupal\status_manager_notifications\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Drupal\status_manager_notifications\Plugin\NotificationProviderManager;

/**
 * Manages and coordinates application status change notifications.
 *
 * Simplified to only handle application entities with clear SMS/email logic.
 */
class NotificationManager {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * The logger service.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * The token replacement service.
   *
   * @var \Drupal\status_manager_notifications\Service\TokenReplacementService
   */
  protected TokenReplacementService $tokenService;

  /**
   * The plugin manager.
   *
   * @var \Drupal\status_manager_notifications\Plugin\NotificationProviderManager
   */
  protected NotificationProviderManager $providerManager;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * Cached provider instances.
   *
   * @var array
   */
  protected array $providers = [];

  /**
   * Constructs a NotificationManager object.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
    TokenReplacementService $token_service,
    NotificationProviderManager $provider_manager,
    EntityTypeManagerInterface $entity_type_manager,
  ) {
    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get('status_manager_notifications');
    $this->tokenService = $token_service;
    $this->providerManager = $provider_manager;
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * Sends notifications for a status change.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   *
   * @return array
   *   Array of results from notification attempts.
   */
  public function sendNotifications(StatusChangeInterface $status_change): array {
    $results = [];
    $application = $status_change->getTargetEntity();

    if (!$application || $application->getEntityTypeId() !== 'application') {
      return $results;
    }

    $new_status = $status_change->getNewStatus();
    $config = $this->getNotificationConfig($new_status);

    if (!$config || empty($config['enabled'])) {
      return $results;
    }

    $recipients = $this->getRecipients($application, $config);
    $message = $this->prepareMessage($config, $application, $status_change);

    foreach ($recipients as $recipient) {
      $result = $this->sendNotification($recipient, $config, $message);
      $results[] = $result;

      if ($result['success']) {
        $this->logger->info('Notification sent to @recipient for application @app_id', [
          '@recipient' => $recipient['email'] ?? $recipient['phone'],
          '@app_id' => $application->getApplicationId(),
        ]);
      }
      else {
        $this->logger->error('Failed to send notification: @error', [
          '@error' => $result['message'],
        ]);
      }
    }

    $this->updateNotificationStatus($status_change, $results);

    return $results;
  }

  /**
   * Gets notification configuration for a specific status.
   *
   * @param string $status
   *   The application status.
   *
   * @return array|null
   *   The notification config or NULL.
   */
  protected function getNotificationConfig(string $status): ?array {
    $config = $this->configFactory->get('status_manager_notifications.settings');
    return $config->get("status_notifications.{$status}");
  }

  /**
   * Gets recipients based on notification config.
   *
   * @param \Drupal\Core\Entity\EntityInterface $application
   *   The application entity.
   * @param array $config
   *   The notification configuration.
   *
   * @return array
   *   Array of recipients with 'email' and optionally 'phone'.
   */
  protected function getRecipients($application, array $config): array {
    $recipients = [];
    $recipient_type = $config['recipient'] ?? 'customer';

    if ($recipient_type === 'customer') {
      $owner = $application->getOwner();
      if ($owner) {
        $recipients[] = [
          'email' => $owner->getEmail(),
          'phone' => $owner->hasField('field_phone_number') ? $owner->get('field_phone_number')->value : NULL,
          'type' => 'customer',
        ];
      }
    }
    elseif ($recipient_type === 'admin') {
      $roles = $config['admin_roles'] ?? ['reviewer'];
      $recipients = $this->getUsersByRoles($roles);
    }

    return $recipients;
  }

  /**
   * Gets users by roles.
   *
   * @param array $roles
   *   Array of role IDs.
   *
   * @return array
   *   Array of recipients.
   */
  protected function getUsersByRoles(array $roles): array {
    $recipients = [];
    $user_storage = $this->entityTypeManager->getStorage('user');

    foreach ($roles as $role) {
      $uids = $this->entityTypeManager->getStorage('user')->getQuery()
        ->condition('status', 1)
        ->condition('roles', $role)
        ->accessCheck(FALSE)
        ->execute();

      $users = $user_storage->loadMultiple($uids);
      foreach ($users as $user) {
        $recipients[] = [
          'email' => $user->getEmail(),
          'phone' => $user->hasField('field_phone_number') ? $user->get('field_phone_number')->value : NULL,
          'type' => 'admin',
        ];
      }
    }

    return $recipients;
  }

  /**
   * Prepares notification message with token replacement.
   *
   * @param array $config
   *   The notification configuration.
   * @param \Drupal\Core\Entity\EntityInterface $application
   *   The application entity.
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   *
   * @return array
   *   Array with 'subject' and 'body'.
   */
  protected function prepareMessage(array $config, $application, StatusChangeInterface $status_change): array {
    $token_data = [
      'application' => $application,
      'status_change' => $status_change,
    ];

    return [
      'subject' => $this->tokenService->replace($config['subject'] ?? '', $token_data),
      'email_body' => $this->tokenService->replace($config['email_message'] ?? $config['message'] ?? '', $token_data),
      'sms_body' => $this->tokenService->replace($config['sms_message'] ?? $config['message'] ?? '', $token_data),
    ];
  }

  /**
   * Sends notification via SMS (preferred) or email.
   *
   * @param array $recipient
   *   Recipient information.
   * @param array $config
   *   Notification configuration.
   * @param array $message
   *   The prepared message.
   *
   * @return array
   *   Result with 'success' and 'message'.
   */
  protected function sendNotification(array $recipient, array $config, array $message): array {
    $prefer_sms = $this->configFactory->get('status_manager_notifications.settings')
      ->get('global.prefer_sms') ?? TRUE;

    // Try SMS first if preferred and phone available.
    if ($prefer_sms && !empty($recipient['phone'])) {
      $sms_provider = $this->getProvider('sms');
      if ($sms_provider && $sms_provider->isConfigured()) {
        return $sms_provider->sendCustomMessage($recipient['phone'], $message['sms_body']);
      }
    }

    // Fallback to email.
    if (!empty($recipient['email'])) {
      $provider_id = $recipient['type'] === 'admin' ? 'email_admin' : 'email';
      $email_provider = $this->getProvider($provider_id);

      if ($email_provider && $email_provider->isConfigured()) {
        return $email_provider->sendCustomMessage(
          $recipient['email'],
          $message['email_body'],
          ['subject' => $message['subject']]
        );
      }
    }

    return [
      'success' => FALSE,
      'message' => 'No valid contact method available',
    ];
  }

  /**
   * Gets a provider instance (lazy loading with caching).
   *
   * @param string $type
   *   Provider type: 'email', 'email_admin', or 'sms'.
   *
   * @return \Drupal\status_manager_notifications\Plugin\NotificationProviderInterface|null
   *   The provider instance or NULL.
   */
  protected function getProvider(string $type): ?object {
    if (isset($this->providers[$type])) {
      return $this->providers[$type];
    }

    $config = $this->configFactory->get('status_manager_notifications.settings');
    $provider_config = $config->get("providers.{$type}") ?? [];

    // Check if provider is enabled.
    if (empty($provider_config['enabled'])) {
      $this->providers[$type] = NULL;
      return NULL;
    }

    // Determine provider ID based on type.
    $provider_id = match ($type) {
      'email' => 'api_application_email',
      'email_admin' => 'application_admin_email',
      'sms' => $this->configFactory->get('sms_providers.settings')->get('default_provider'),
      default => NULL,
    };

    if (empty($provider_id)) {
      $this->providers[$type] = NULL;
      return NULL;
    }

    try {
      $this->providers[$type] = $this->providerManager->createInstance(
        $provider_id,
        $provider_config
      );
      return $this->providers[$type];
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to load provider @type: @error', [
        '@type' => $type,
        '@error' => $e->getMessage(),
      ]);
      $this->providers[$type] = NULL;
      return NULL;
    }
  }

  /**
   * Updates the status change entity with notification results.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $results
   *   The notification results.
   */
  protected function updateNotificationStatus(StatusChangeInterface $status_change, array $results): void {
    $success_count = count(array_filter($results, fn($r) => $r['success']));
    $total_count = count($results);

    if ($total_count === 0) {
      $status_change->setNotificationStatus('none');
    }
    elseif ($success_count === $total_count) {
      $status_change->setNotificationStatus('sent');
    }
    elseif ($success_count > 0) {
      $status_change->setNotificationStatus('partial');
    }
    else {
      $status_change->setNotificationStatus('failed');
    }

    $log_messages = array_map(fn($r) => $r['message'] ?? 'Unknown', $results);
    $status_change->set('notification_log', implode("\n", $log_messages));
    $status_change->save();
  }

}
