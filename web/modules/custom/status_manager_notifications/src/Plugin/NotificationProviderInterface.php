<?php

namespace Drupal\status_manager_notifications\Plugin;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Component\Plugin\PluginInspectionInterface;
use Drupal\Component\Plugin\ConfigurableInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\status_manager\Entity\StatusChangeInterface;

/**
 * Defines an interface for Notification Provider plugins.
 */
interface NotificationProviderInterface extends PluginInspectionInterface, ConfigurableInterface, ContainerFactoryPluginInterface {

  /**
   * Sends a notification for a status change.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $options
   *   Additional options for the notification:
   *   - recipient: Override recipient (email/phone).
   *   - template_id: Use a specific template.
   *   - custom_message: Send a custom message instead of template.
   *   - additional_data: Extra data for token replacement.
   *
   * @return array
   *   An array with 'success' (bool) and 'message' (string) keys.
   */
  public function send(StatusChangeInterface $status_change, array $options = []);

  /**
   * Sends a notification for a status change.
   *
   * This is a convenience method that wraps the send() method.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   *
   * @return array
   *   An array with 'success' (bool) and 'message' (string) keys.
   */
  public function sendStatusChangeNotification(StatusChangeInterface $status_change);

  /**
   * Sends a custom notification message.
   *
   * @param string $recipient
   *   The recipient (email address or phone number).
   * @param string $message
   *   The message to send.
   * @param array $options
   *   Additional options specific to the provider.
   *
   * @return array
   *   An array with 'success' (bool) and 'message' (string) keys.
   */
  public function sendCustomMessage($recipient, $message, array $options = []);

  /**
   * Gets the notification type handled by this provider.
   *
   * @return string
   *   The notification type ('email', 'sms', etc.).
   */
  public function getType();

  /**
   * Checks if this provider is properly configured and ready to use.
   *
   * @return bool
   *   TRUE if the provider is ready, FALSE otherwise.
   */
  public function isConfigured();

  /**
   * Gets the configuration form for this provider.
   *
   * @param array $form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   *
   * @return array
   *   The form elements for this provider's configuration.
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state);

  /**
   * Validates the configuration form.
   *
   * @param array &$form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function validateConfigurationForm(array &$form, FormStateInterface $form_state);

  /**
   * Submits the configuration form.
   *
   * @param array &$form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state);

  /**
   * Tests the provider configuration.
   *
   * @param string $recipient
   *   The test recipient.
   *
   * @return array
   *   An array with 'success' (bool) and 'message' (string) keys.
   */
  public function testConfiguration($recipient);

  /**
   * Gets provider-specific help text.
   *
   * @return string
   *   Help text for configuring this provider.
   */
  public function getHelpText();

}
