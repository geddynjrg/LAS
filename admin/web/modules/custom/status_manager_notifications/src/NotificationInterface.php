<?php

namespace Drupal\status_manager_notifications;

use Drupal\status_manager\Entity\StatusChangeInterface;

/**
 * Interface for notification services.
 */
interface NotificationInterface {

  /**
   * Sends a notification for a status change.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $options
   *   Additional options for the notification.
   *
   * @return array
   *   An array with 'success' (bool) and 'message' (string) keys.
   */
  public function sendNotification(StatusChangeInterface $status_change, array $options = []);

  /**
   * Gets the notification type handled by this service.
   *
   * @return string
   *   The notification type ('email', 'sms', etc.).
   */
  public function getNotificationType();

  /**
   * Checks if this notification service is enabled.
   *
   * @return bool
   *   TRUE if the notification service is enabled, FALSE otherwise.
   */
  public function isEnabled();

  /**
   * Gets the configuration for this notification service.
   *
   * @return array
   *   Configuration array.
   */
  public function getConfiguration();

  /**
   * Validates the configuration for this notification service.
   *
   * @param array $configuration
   *   The configuration to validate.
   *
   * @return array
   *   Array of validation errors, empty if valid.
   */
  public function validateConfiguration(array $configuration);

}
