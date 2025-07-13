<?php

namespace Drupal\sms_providers\Plugin;

use Drupal\Component\Plugin\ConfigurableInterface;
use Drupal\Component\Plugin\PluginInspectionInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;

/**
 * Defines an interface for SMS Provider plugins.
 */
interface SmsProviderInterface extends PluginInspectionInterface, ConfigurableInterface, ContainerFactoryPluginInterface {

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
  public function buildConfigurationForm(array $form, FormStateInterface $form_state): array;

  /**
   * Gets the provider's name/label.
   *
   * @return string
   *   The human-readable provider name.
   */
  public function getLabel(): string;

  /**
   * Gets the provider's unique ID.
   *
   * @return string
   *   The provider ID.
   */
  public function getProviderId(): string;

  /**
   * Checks if this provider is properly configured and ready to use.
   *
   * @return bool
   *   TRUE if the provider is ready, FALSE otherwise.
   */
  public function isConfigured(): bool;

  /**
   * Sends an SMS message.
   *
   * @param string $to
   *   The recipient phone number.
   * @param string $message
   *   The message content to send.
   * @param array $options
   *   Additional options for sending.
   *
   * @return array
   *   An array with the following keys:
   *   - success: (bool) Whether the message was sent successfully.
   *   - message: (string) Success or error message.
   *   - message_id: (string) Provider's message ID for tracking.
   */
  public function sendSms(string $to, string $message, array $options = []): array;

  /**
   * Submits the configuration form.
   *
   * @param array &$form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state): void;

  /**
   * Validates the configuration form.
   *
   * @param array &$form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function validateConfigurationForm(array &$form, FormStateInterface $form_state): void;

}
