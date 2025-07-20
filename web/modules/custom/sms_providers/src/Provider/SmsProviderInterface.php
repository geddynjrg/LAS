<?php

namespace Drupal\sms_providers\Provider;

/**
 * Interface for SMS providers.
 */
interface SmsProviderInterface {

  /**
   * Gets the provider's unique identifier.
   *
   * @return string
   *   The provider ID.
   */
  public function getId(): string;

  /**
   * Gets the provider's human-readable name.
   *
   * @return string
   *   The provider name.
   */
  public function getName(): string;

  /**
   * Checks if this provider is properly configured.
   *
   * @return bool
   *   TRUE if the provider is ready to send messages.
   */
  public function isConfigured(): bool;

  /**
   * Sends an SMS message.
   *
   * @param string $to
   *   The recipient phone number in E.164 format.
   * @param string $message
   *   The message content to send.
   *
   * @throws \Exception
   *   If the message fails to send.
   *
   * @return string
   *   The provider's message ID for tracking.
   */
  public function sendSms(string $to, string $message): string;

}
