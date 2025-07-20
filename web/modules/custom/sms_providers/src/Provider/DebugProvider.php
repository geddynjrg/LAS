<?php

namespace Drupal\sms_providers\Provider;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * Debug SMS provider that logs messages instead of sending them.
 */
class DebugProvider implements SmsProviderInterface {

  use StringTranslationTrait;

  /**
   * The config factory.
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * The logger channel.
   */
  protected LoggerChannelInterface $logger;

  /**
   * Constructs a DebugProvider object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelInterface $logger
   *   The logger channel.
   */
  public function __construct(ConfigFactoryInterface $config_factory, LoggerChannelInterface $logger) {
    $this->configFactory = $config_factory;
    $this->logger = $logger;
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
    $config = $this->getConfig();

    return !empty($config['enabled']);
  }

  /**
   * {@inheritdoc}
   */
  public function sendSms(string $to, string $message): string {
    $config = $this->getConfig();

    // Simulate random failures if enabled.
    if (!empty($config['simulate_failures']) && mt_rand(1, 10) === 1) {
      throw new \Exception('Simulated failure: Network timeout occurred');
    }

    // Generate a fake message ID.
    $message_id = 'debug_' . uniqid();

    // Prepare log context.
    $context = [
      '@provider' => $this->getName(),
      '@to' => $to,
      '@message_id' => $message_id,
      '@message' => $message,
      'message_length' => \strlen($message),
    ];

    $log_message = 'SMS would be sent via @provider to @to (ID: @message_id): "@message"';

    // Log the message at the configured level.
    $log_level = $config['log_level'] ?? 'info';
    $this->logger->log($log_level, $log_message, $context);

    return $message_id;
  }

  /**
   * Gets the provider configuration.
   *
   * @return array
   *   The provider configuration.
   */
  protected function getConfig(): array {
    return [
      'enabled' => TRUE,
      'log_level' => 'info',
      'simulate_failures' => FALSE,
    ];
  }

}
