<?php

namespace Drupal\status_manager_notifications\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Drupal\status_manager_notifications\NotificationInterface;

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
   * Constructs a NotificationManager object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
  ) {
    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get('status_manager_notifications');
    $this->notificationServices = [];
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
   * Sends notifications for a status change.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   *
   * @return array
   *   Array of results from each notification service.
   */
  public function sendNotifications(StatusChangeInterface $status_change) {
    $notification_type = $status_change->getNotificationType();
    $results = [];

    if ($notification_type === 'none') {
      return $results;
    }

    // Handle 'both' notification type.
    if ($notification_type === 'both') {
      $types_to_send = ['email', 'sms'];
    }
    else {
      $types_to_send = [$notification_type];
    }

    foreach ($types_to_send as $type) {
      if (isset($this->notificationServices[$type])) {
        $service = $this->notificationServices[$type];

        if ($service->isEnabled()) {
          try {
            $result = $service->sendNotification($status_change);
            $results[$type] = $result;

            $this->logger->info('Notification sent via @type for status change @id: @message', [
              '@type' => $type,
              '@id' => $status_change->id(),
              '@message' => $result['message'] ?? 'Success',
            ]);
          }
          catch (\Exception $e) {
            $results[$type] = [
              'success' => FALSE,
              'message' => $e->getMessage(),
            ];

            $this->logger->error('Failed to send @type notification for status change @id: @error', [
              '@type' => $type,
              '@id' => $status_change->id(),
              '@error' => $e->getMessage(),
            ]);
          }
        }
        else {
          $results[$type] = [
            'success' => FALSE,
            'message' => 'Service not enabled',
          ];
        }
      }
      else {
        $results[$type] = [
          'success' => FALSE,
          'message' => 'Service not available',
        ];
      }
    }

    // Update the status change entity with notification results.
    $this->updateNotificationStatus($status_change, $results);

    return $results;
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

}
