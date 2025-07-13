<?php

namespace Drupal\sms_providers\Service;

use Drupal\sms_providers\Plugin\SmsProviderInterface;

/**
 * Defines an interface for the SMS service.
 */
interface SmsServiceInterface {

  /**
   * Gets the default SMS provider.
   *
   * @return \Drupal\sms_providers\Plugin\SmsProviderInterface|null
   *   The default provider instance or NULL.
   */
  public function getDefaultProvider(): ?SmsProviderInterface;

  /**
   * Checks if the SMS service is properly configured.
   *
   * @return bool
   *   TRUE if at least one provider is configured and enabled.
   */
  public function isConfigured(): bool;

  /**
   * Sends an SMS message using the configured provider.
   *
   * @param string $to
   *   The recipient phone number.
   * @param string $message
   *   The message content to send.
   * @param array $options
   *   Additional options:
   *   - provider: Specific provider ID to use.
   *
   * @return array
   *   Result array with success, message, message_id, and provider info.
   */
  public function sendSms(string $to, string $message, array $options = []): array;

}
