<?php

namespace Drupal\sms_providers\Provider;

use Drupal\Core\Mail\MailManagerInterface;
use Drupal\Core\Site\Settings;
use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * Debug SMS provider that sends messages via email.
 */
class DebugProvider implements SmsProviderInterface {

  use StringTranslationTrait;

  /**
   * Settings key in settings.php.
   */
  public const SETTINGS_KEY = 'debug_sms_email';

  /**
   * The mail manager.
   */
  protected MailManagerInterface $mailManager;

  /**
   * Constructs a DebugProvider object.
   *
   * @param \Drupal\Core\Mail\MailManagerInterface $mail_manager
   *   The mail manager.
   */
  public function __construct(MailManagerInterface $mail_manager) {
    $this->mailManager = $mail_manager;
  }

  /**
   * {@inheritdoc}
   */
  public function getId(): string {
    return 'debug';
  }

  /**
   * {@inheritdoc}
   */
  public function getName(): string {
    return 'Debug SMS Provider';
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured(): bool {
    $debug_email = Settings::get(self::SETTINGS_KEY);
    return !empty($debug_email) && filter_var($debug_email, FILTER_VALIDATE_EMAIL);
  }

  /**
   * {@inheritdoc}
   */
  public function sendSms(string $to, string $message): string {
    if (!$this->isConfigured()) {
      throw new \Exception('Debug SMS provider requires debug_sms_email setting to be configured');
    }

    $debug_email = Settings::get(self::SETTINGS_KEY);
    $message_id = 'debug_' . uniqid();

    // Prepare email parameters.
    $params = [
      'phone_number' => $to,
      'message' => $message,
      'message_id' => $message_id,
      'timestamp' => time(),
      'message_length' => strlen($message),
    ];

    // Send the email.
    $result = $this->mailManager->mail(
      'sms_providers',
      'debug_sms',
      $debug_email,
      'en',
      $params
    );

    if (!$result['result']) {
      throw new \Exception('Failed to send debug SMS email');
    }

    return $message_id;
  }

}
