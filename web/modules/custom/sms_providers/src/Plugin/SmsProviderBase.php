<?php

namespace Drupal\sms_providers\Plugin;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\Plugin\PluginBase;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Base class for SMS Provider plugins.
 */
abstract class SmsProviderBase extends PluginBase implements SmsProviderInterface {

  use StringTranslationTrait;

  public const ERROR_CODE_API_ERROR = 'API_ERROR';

  public const ERROR_CODE_EMPTY_RESPONSE = 'EMPTY_RESPONSE';

  public const ERROR_CODE_EXCEPTION = 'EXCEPTION';

  public const ERROR_CODE_HTTP_ERROR = 'HTTP_ERROR';

  /**
   * Standard error codes for SMS providers.
   */
  public const ERROR_CODE_NOT_CONFIGURED = 'NOT_CONFIGURED';

  public const ERROR_CODE_REQUEST_FAILED = 'REQUEST_FAILED';

  public const ERROR_CODE_UNEXPECTED_ERROR = 'UNEXPECTED_ERROR';

  /**
   * The logger channel name for SMS providers.
   */
  public const LOGGER_CHANNEL = 'sms_providers';

  /**
   * The config factory.
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * The logger channel.
   */
  protected LoggerChannelInterface $logger;

  /**
   * Constructs an SmsProviderBase object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get(self::LOGGER_CHANNEL);
    $this->setConfiguration($configuration);
  }

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state): array {
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function calculateDependencies(): array {
    return [];
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('config.factory'),
      $container->get('logger.factory')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [];
  }

  /**
   * {@inheritdoc}
   */
  public function getConfiguration(): array {
    return $this->configuration;
  }

  /**
   * {@inheritdoc}
   */
  public function getLabel(): string {
    return $this->pluginDefinition['label'] ?? $this->getPluginId();
  }

  /**
   * {@inheritdoc}
   */
  public function getProviderId(): string {
    return $this->getPluginId();
  }

  /**
   * {@inheritdoc}
   */
  public function sendSms(string $to, string $message, array $options = []): array {
    if (!$this->isConfigured()) {
      return [
        'success' => FALSE,
        'message' => $this->t('@provider is not properly configured.', [
          '@provider' => $this->getLabel(),
        ]),
        'message_id' => NULL,
      ];
    }

    // Validate phone number format.
    $to = $this->normalizePhoneNumber($to);

    if (!$this->isValidPhoneNumber($to)) {
      return [
        'success' => FALSE,
        'message' => $this->t('Invalid phone number format: @phone', ['@phone' => $to]),
        'message_id' => NULL,
      ];
    }

    // Validate message content.
    if (empty(trim($message))) {
      return [
        'success' => FALSE,
        'message' => $this->t('Message content cannot be empty.'),
        'message_id' => NULL,
      ];
    }

    $this->log('info', 'Sending SMS to @to via @provider', [
      '@to' => $to,
      '@provider' => $this->getLabel(),
      'message_length' => \strlen($message),
    ]);

    try {
      $result = $this->doSendSms($to, $message, $options);

      if ($result['success']) {
        $this->log('info', 'SMS sent successfully via @provider. Message ID: @id', [
          '@provider' => $this->getLabel(),
          '@id' => $result['message_id'] ?? 'unknown',
        ]);
      }
      else {
        $this->log('error', 'Failed to send SMS via @provider: @error', [
          '@provider' => $this->getLabel(),
          '@error' => $result['message'] ?? 'Unknown error',
        ]);
      }

      return $result;
    }
    catch (\Exception $e) {
      $this->log('error', 'Exception while sending SMS via @provider: @error', [
        '@provider' => $this->getLabel(),
        '@error' => $e->getMessage(),
      ]);

      return [
        'success' => FALSE,
        'message' => $this->t('Failed to send SMS: @error', ['@error' => $e->getMessage()]),
        'message_id' => NULL,
      ];
    }
  }

  /**
   * {@inheritdoc}
   */
  public function setConfiguration(array $configuration): void {
    $this->configuration = $configuration + $this->defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state): void {
    $this->configuration['enabled'] = $form_state->getValue('enabled');
  }

  /**
   * {@inheritdoc}
   */
  public function validateConfigurationForm(array &$form, FormStateInterface $form_state): void {
    // Subclasses should implement specific validation.
  }

  /**
   * Performs the actual SMS sending to the provider's API.
   *
   * @param string $to
   *   The normalized recipient phone number.
   * @param string $message
   *   The message content.
   * @param array $options
   *   Additional sending options.
   *
   * @return array
   *   Result array with success, message_id, and message.
   */
  abstract protected function doSendSms(string $to, string $message, array $options = []): array;

  /**
   * Validates a phone number format.
   *
   * @param string $phone
   *   The phone number to validate.
   *
   * @return bool
   *   TRUE if valid, FALSE otherwise.
   */
  protected function isValidPhoneNumber(string $phone): bool {
    // Basic E.164 validation (7-15 digits with + prefix).
    return preg_match('/^\+[1-9]\d{6,14}$/', $phone);
  }

  /**
   * Logs an SMS-related event.
   *
   * @param string $level
   *   The log level.
   * @param string $message
   *   The log message.
   * @param array $context
   *   The log context.
   */
  protected function log(string $level, string $message, array $context = []): void {
    $context['@provider'] = $this->getLabel();
    $this->logger->log($level, $message, $context);
  }

  /**
   * Normalizes a phone number to E.164 format.
   *
   * @param string $phone
   *   The phone number to normalize.
   *
   * @return string
   *   The normalized phone number.
   */
  protected function normalizePhoneNumber(string $phone): string {
    // Remove all non-digit characters.
    $phone = preg_replace('/\D/', '', $phone);

    // Add + prefix if not present.
    if (!str_starts_with($phone, '+')) {
      $phone = '+' . $phone;
    }

    return $phone;
  }

}
