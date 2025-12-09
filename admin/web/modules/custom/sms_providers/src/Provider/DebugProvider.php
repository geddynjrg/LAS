<?php

namespace Drupal\sms_providers\Provider;

use Drupal\Core\Mail\MailManagerInterface;
use Drupal\Core\State\StateInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * Debug SMS provider that sends messages via email.
 */
class DebugProvider implements SmsProviderInterface {

  use StringTranslationTrait;

  /**
   * State key for debug email.
   */
  public const STATE_DEBUG_EMAIL = 'sms_providers.debug_email';

  /**
   * The state service.
   */
  protected StateInterface $state;

  /**
   * The mail manager.
   */
  protected MailManagerInterface $mailManager;

  /**
   * Constructs a DebugProvider object.
   *
   * @param \Drupal\Core\State\StateInterface $state
   *   The state service.
   * @param \Drupal\Core\Mail\MailManagerInterface $mail_manager
   *   The mail manager.
   */
  public function __construct(StateInterface $state, MailManagerInterface $mail_manager) {
    $this->state = $state;
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
    $debug_email = $this->state->get(self::STATE_DEBUG_EMAIL);
    return !empty($debug_email) && filter_var($debug_email, FILTER_VALIDATE_EMAIL);
  }

  /**
   * {@inheritdoc}
   */
  public function sendSms(string $to, string $message): string {
    if (!$this->isConfigured()) {
      throw new \Exception('Debug SMS provider requires debug email to be configured in settings');
    }

    $debug_email = $this->state->get(self::STATE_DEBUG_EMAIL);
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

    if (empty($result['send'])) {
      throw new \Exception('Failed to send debug SMS email');
    }

    return $message_id;
  }

}
