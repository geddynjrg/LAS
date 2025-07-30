<?php

namespace Drupal\status_manager_notifications\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Drupal\status_manager_notifications\NotificationInterface;
use Drupal\status_manager_notifications\Plugin\NotificationProviderManager;
use Drupal\Core\Entity\EntityInterface;
use Drupal\user\EntityOwnerInterface;

/**
 * Manages and coordinates all notification services.
 */
class NotificationManager {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The logger service.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * Array of notification services.
   *
   * @var \Drupal\status_manager_notifications\NotificationInterface[]
   */
  protected $notificationServices;

  /**
   * The notification provider plugin manager.
   *
   * @var \Drupal\status_manager_notifications\Plugin\NotificationProviderManager
   */
  protected $providerManager;

  /**
   * Constructs a NotificationManager object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   * @param \Drupal\status_manager_notifications\Plugin\NotificationProviderManager $provider_manager
   *   The notification provider plugin manager.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
    NotificationProviderManager $provider_manager,
  ) {
    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get('status_manager_notifications');
    $this->notificationServices = [];
    $this->providerManager = $provider_manager;
  }

  /**
   * Registers a notification service.
   *
   * @param \Drupal\status_manager_notifications\NotificationInterface $service
   *   The notification service to register.
   */
  public function registerNotificationService(NotificationInterface $service) {
    $this->notificationServices[$service->getNotificationType()] = $service;
  }

  /**
   * Sends notifications for a status change using the plugin system.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   *
   * @return array
   *   Array of results from each notification service.
   */
  public function sendNotificationsViaPlugins(StatusChangeInterface $status_change) {
    $notification_type = $status_change->getNotificationType();
    $results = [];

    if ($notification_type === 'none') {
      return $results;
    }

    // Handle 'both' notification type.
    $types_to_send = $notification_type === 'both' ? ['email', 'sms'] : [$notification_type];

    foreach ($types_to_send as $type) {
      // Get the target entity.
      $entity = $status_change->getTargetEntity();
      if (!$entity) {
        $results[$type] = [
          'success' => FALSE,
          'message' => 'Target entity not found.',
        ];
        continue;
      }

      // Check for entity-specific notification settings.
      $entity_settings = $this->getEntityNotificationSettings($entity->getEntityTypeId(), $type);

      if ($entity_settings['skip']) {
        // Entity-specific settings indicate notifications should be skipped.
        $results[$type] = [
          'success' => FALSE,
          'message' => $entity_settings['message'],
        ];
        continue;
      }

      $active_provider_id = $entity_settings['provider_id'];
      $provider_config = $entity_settings['provider_config'];

      try {

        /** @var \Drupal\status_manager_notifications\Plugin\NotificationProviderInterface $provider */
        $provider = $this->providerManager->createInstance($active_provider_id, $provider_config);

        if (!$provider->isConfigured()) {
          $results[$type] = [
            'success' => FALSE,
            'message' => "Provider {$active_provider_id} is not properly configured.",
          ];
          continue;
        }

        // Send notification via provider.
        // Pass entity settings as options for potential template overrides.
        $notification_options = [
          'entity_settings' => $entity_settings,
        ];

        $result = $provider->sendStatusChangeNotification($status_change, $notification_options);
        $results[$type] = $result;

        if ($result['success']) {
          $this->logger->info('Notification sent via @type provider @provider for status change @id', [
            '@type' => $type,
            '@provider' => $active_provider_id,
            '@id' => $status_change->id(),
          ]);
        }
        else {
          $this->logger->error('Failed to send @type notification via @provider for status change @id: @error', [
            '@type' => $type,
            '@provider' => $active_provider_id,
            '@id' => $status_change->id(),
            '@error' => $result['message'] ?? 'Unknown error',
          ]);
        }
      }
      catch (\Exception $e) {
        $results[$type] = [
          'success' => FALSE,
          'message' => $e->getMessage(),
        ];

        $this->logger->error('Exception sending @type notification for status change @id: @error', [
          '@type' => $type,
          '@id' => $status_change->id(),
          '@error' => $e->getMessage(),
        ]);
      }
    }

    // Update the status change entity with notification results.
    $this->updateNotificationStatus($status_change, $results);

    return $results;
  }

  /**
   * Sends notifications for a status change.
   *
   * This is the main method called by status_manager module.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   *
   * @return array
   *   Array of results from each notification service.
   */
  public function sendNotifications(StatusChangeInterface $status_change) {
    // Use the plugin-based system.
    return $this->sendNotificationsViaPlugins($status_change);
  }

  /**
   * Gets all available notification services.
   *
   * @return \Drupal\status_manager_notifications\NotificationInterface[]
   *   Array of notification services.
   */
  public function getNotificationServices() {
    return $this->notificationServices;
  }

  /**
   * Gets a specific notification service by type.
   *
   * @param string $type
   *   The notification type.
   *
   * @return \Drupal\status_manager_notifications\NotificationInterface|null
   *   The notification service or NULL if not found.
   */
  public function getNotificationService($type) {
    return $this->notificationServices[$type] ?? NULL;
  }

  /**
   * Checks if a notification type is available and enabled.
   *
   * @param string $type
   *   The notification type.
   *
   * @return bool
   *   TRUE if available and enabled, FALSE otherwise.
   */
  public function isNotificationTypeAvailable($type) {
    $service = $this->getNotificationService($type);
    return $service && $service->isEnabled();
  }

  /**
   * Sends a custom notification message.
   *
   * @param string $type
   *   The notification type (email, sms).
   * @param string|array $recipients
   *   The recipient(s).
   * @param string $message
   *   The message content.
   * @param array $options
   *   Additional options for the notification.
   *
   * @return array
   *   Result array with 'success' and 'message' keys.
   */
  public function sendCustomMessage($type, $recipients, $message, array $options = []) {
    $config = $this->configFactory->get('status_manager_notifications.settings');
    $active_provider_id = $config->get("{$type}.active_provider");

    if (!$active_provider_id) {
      return [
        'success' => FALSE,
        'message' => "No active {$type} provider configured.",
      ];
    }

    try {
      // Load provider configuration.
      $provider_config = $config->get("{$type}.providers.{$active_provider_id}") ?: [];

      /** @var \Drupal\status_manager_notifications\Plugin\NotificationProviderInterface $provider */
      $provider = $this->providerManager->createInstance($active_provider_id, $provider_config);

      if (!$provider->isConfigured()) {
        return [
          'success' => FALSE,
          'message' => "Provider {$active_provider_id} is not properly configured.",
        ];
      }

      // Handle single recipient.
      if (!is_array($recipients)) {
        $recipients = [$recipients];
      }

      $results = [];
      $all_success = TRUE;

      foreach ($recipients as $recipient) {
        $result = $provider->sendCustomMessage($recipient, $message, $options);
        $results[$recipient] = $result;

        if (!$result['success']) {
          $all_success = FALSE;
          $this->logger->error('Failed to send custom @type message to @recipient: @error', [
            '@type' => $type,
            '@recipient' => $recipient,
            '@error' => $result['message'] ?? 'Unknown error',
          ]);
        }
      }

      return [
        'success' => $all_success,
        'message' => $all_success ? 'Messages sent successfully.' : 'Some messages failed to send.',
        'details' => $results,
      ];
    }
    catch (\Exception $e) {
      $this->logger->error('Exception sending custom @type message: @error', [
        '@type' => $type,
        '@error' => $e->getMessage(),
      ]);

      return [
        'success' => FALSE,
        'message' => $e->getMessage(),
      ];
    }
  }

  /**
   * Gets all available notification providers.
   *
   * @return array
   *   Array of provider definitions grouped by type.
   */
  public function getAvailableProviders() {
    return $this->providerManager->getProvidersByType();
  }

  /**
   * Gets providers for a specific notification type.
   *
   * @param string $type
   *   The notification type (email, sms).
   *
   * @return array
   *   Array of provider definitions.
   */
  public function getProvidersForType($type) {
    return $this->providerManager->getProvidersForType($type);
  }

  /**
   * Updates the notification status on the status change entity.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $results
   *   The notification results.
   */
  protected function updateNotificationStatus(StatusChangeInterface $status_change, array $results) {
    $all_successful = TRUE;
    $log_messages = [];

    foreach ($results as $type => $result) {
      if (!$result['success']) {
        $all_successful = FALSE;
      }
      $log_messages[] = $type . ': ' . $result['message'];
    }

    if (empty($results)) {
      $status_change->setNotificationStatus('none');
    }
    elseif ($all_successful) {
      $status_change->setNotificationStatus('sent');
    }
    else {
      $status_change->setNotificationStatus('failed');
    }

    $status_change->setNotificationLog(implode("\n", $log_messages));
    $status_change->save();
  }

  /**
   * Get recipient contact information from an entity.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The entity to get contact information from.
   *
   * @return array
   *   Array with 'email' and 'phone' keys containing contact information.
   */
  protected function getRecipientContactInfo(EntityInterface $entity) {
    $contact_info = [
      'email' => [],
      'phone' => [],
    ];

    // Handle different entity types.
    switch ($entity->getEntityTypeId()) {
      case 'application':
        $contact_info = $this->getApplicationContactInfo($entity);
        break;

      case 'user':
        $contact_info = $this->getUserContactInfo($entity);
        break;

      case 'node':
        $contact_info = $this->getNodeContactInfo($entity);
        break;

      default:
        // For other entity types, try to get owner information.
        if ($entity instanceof EntityOwnerInterface) {
          $owner = $entity->getOwner();
          if ($owner && $owner->getEmail()) {
            $contact_info['email'][] = $owner->getEmail();
          }
        }
        break;
    }

    return $contact_info;
  }

  /**
   * Get contact information from a loan application.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The application entity.
   *
   * @return array
   *   Array with email and phone contact information.
   */
  protected function getApplicationContactInfo(EntityInterface $entity) {
    $contact_info = [
      'email' => [],
      'phone' => [],
    ];

    // Get email from the application owner (user who submitted the
    // application).
    if ($entity instanceof EntityOwnerInterface) {
      $owner = $entity->getOwner();
      if ($owner && $owner->getEmail()) {
        $contact_info['email'][] = $owner->getEmail();
      }
    }

    // Get phone numbers from group members.
    if ($entity->hasField('group_members') && !$entity->get('group_members')->isEmpty()) {
      foreach ($entity->get('group_members') as $member_reference) {
        if ($member_reference->entity) {
          $member = $member_reference->entity;
          if ($member->hasField('phone_number') && !$member->get('phone_number')->isEmpty()) {
            $phone = $member->get('phone_number')->value;
            if (!empty($phone)) {
              $contact_info['phone'][] = $phone;
            }
          }
        }
      }
    }

    // Remove duplicates.
    $contact_info['email'] = array_unique($contact_info['email']);
    $contact_info['phone'] = array_unique($contact_info['phone']);

    return $contact_info;
  }

  /**
   * Get contact information from a user entity.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The user entity.
   *
   * @return array
   *   Array with email and phone contact information.
   */
  protected function getUserContactInfo(EntityInterface $entity) {
    $contact_info = [
      'email' => [],
      'phone' => [],
    ];

    // Get email from user.
    if ($entity->getEmail()) {
      $contact_info['email'][] = $entity->getEmail();
    }

    // Get phone number if available.
    if ($entity->hasField('field_phone') && !$entity->get('field_phone')->isEmpty()) {
      $phone = $entity->get('field_phone')->value;
      if (!empty($phone)) {
        $contact_info['phone'][] = $phone;
      }
    }

    return $contact_info;
  }

  /**
   * Get contact information from a node entity.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The node entity.
   *
   * @return array
   *   Array with email and phone contact information.
   */
  protected function getNodeContactInfo(EntityInterface $entity) {
    $contact_info = [
      'email' => [],
      'phone' => [],
    ];

    // Get email from node author.
    if ($entity instanceof EntityOwnerInterface) {
      $owner = $entity->getOwner();
      if ($owner && $owner->getEmail()) {
        $contact_info['email'][] = $owner->getEmail();
      }
    }

    // Check for email fields on the node itself.
    if ($entity->hasField('field_email') && !$entity->get('field_email')->isEmpty()) {
      $email = $entity->get('field_email')->value;
      if (!empty($email)) {
        $contact_info['email'][] = $email;
      }
    }

    // Check for phone fields on the node itself.
    if ($entity->hasField('field_phone') && !$entity->get('field_phone')->isEmpty()) {
      $phone = $entity->get('field_phone')->value;
      if (!empty($phone)) {
        $contact_info['phone'][] = $phone;
      }
    }

    // Remove duplicates.
    $contact_info['email'] = array_unique($contact_info['email']);
    $contact_info['phone'] = array_unique($contact_info['phone']);

    return $contact_info;
  }

  /**
   * Gets entity-specific notification settings.
   *
   * @param string $entity_type_id
   *   The entity type ID.
   * @param string $notification_type
   *   The notification type ('email' or 'sms').
   *
   * @return array
   *   Array with keys:
   *   - skip: (bool) Whether to skip notification.
   *   - message: (string) Skip reason message.
   *   - provider_id: (string) Provider ID to use.
   *   - provider_config: (array) Provider configuration.
   */
  protected function getEntityNotificationSettings($entity_type_id, $notification_type) {
    $notification_config = $this->configFactory->get('status_manager_notifications.settings');

    // Check if entity-specific override is enabled.
    $entity_settings = $notification_config->get("entities.{$entity_type_id}");

    if (!empty($entity_settings['override_enabled'])) {
      // Entity-specific settings are enabled, use those.
      $provider_key = "{$notification_type}_provider";

      if (isset($entity_settings[$provider_key])) {
        $entity_provider_id = $entity_settings[$provider_key];

        if (empty($entity_provider_id) || $entity_provider_id === 'none') {
          // Entity-specific setting disables this notification type.
          return [
            'skip' => TRUE,
            'message' => "Entity-specific {$notification_type} notifications disabled for {$entity_type_id}.",
            'provider_id' => NULL,
            'provider_config' => [],
          ];
        }

        // Load entity-specific provider config.
        $entity_provider_config = $notification_config->get("{$notification_type}.providers.{$entity_provider_id}") ?: [];

        return [
          'skip' => FALSE,
          'message' => '',
          'provider_id' => $entity_provider_id,
          'provider_config' => $entity_provider_config,
        ];
      }
    }

    // Fall back to global settings.
    $global_provider_id = $notification_config->get("{$notification_type}.active_provider");

    if (!$global_provider_id) {
      return [
        'skip' => TRUE,
        'message' => "No active {$notification_type} provider configured.",
        'provider_id' => NULL,
        'provider_config' => [],
      ];
    }

    $global_provider_config = $notification_config->get("{$notification_type}.providers.{$global_provider_id}") ?: [];

    return [
      'skip' => FALSE,
      'message' => '',
      'provider_id' => $global_provider_id,
      'provider_config' => $global_provider_config,
    ];
  }

}
