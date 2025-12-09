<?php

namespace Drupal\sms_providers\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\State\StateInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\sms_providers\Provider\SmsProviderInterface;

/**
 * SMS service for unified SMS sending across providers.
 */
class SmsService implements SmsServiceInterface {

  use StringTranslationTrait;

  /**
   * State key for default provider.
   */
  public const STATE_DEFAULT_PROVIDER = 'sms_providers.default_provider';

  /**
   * The config factory.
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * The logger channel.
   */
  protected LoggerChannelInterface $logger;

  /**
   * The phone number validation service.
   */
  protected PhoneNumberValidationService $phoneValidation;

  /**
   * The state service.
   */
  protected StateInterface $state;

  /**
   * Registered SMS providers.
   *
   * @var array<string, \Drupal\sms_providers\Provider\SmsProviderInterface>
   */
  protected array $providers = [];

  /**
   * SMS service settings.
   */
  protected ImmutableConfig $settings;

  /**
   * Constructs an SmsService object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelInterface $logger
   *   The logger channel.
   * @param \Drupal\sms_providers\Service\PhoneNumberValidationService $phone_validation
   *   The phone number validation service.
   * @param \Drupal\Core\State\StateInterface $state
   *   The state service.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    LoggerChannelInterface $logger,
    PhoneNumberValidationService $phone_validation,
    StateInterface $state,
  ) {
    $this->configFactory = $config_factory;
    $this->logger = $logger;
    $this->phoneValidation = $phone_validation;
    $this->state = $state;
    $this->settings = $config_factory->get('sms_providers.settings');
  }

  /**
   * Registers an SMS provider.
   *
   * @param string $id
   *   The provider ID.
   * @param \Drupal\sms_providers\Provider\SmsProviderInterface $provider
   *   The provider instance.
   */
  public function addProvider(string $id, SmsProviderInterface $provider): void {
    $this->providers[$id] = $provider;
  }

  /**
   * Gets all registered providers.
   *
   * @return array
   *   An array of all provider instances.
   */
  public function getAllProviders(): array {
    return $this->providers;
  }

  /**
   * {@inheritdoc}
   */
  public function getDefaultProvider(): ?SmsProviderInterface {
    // Try state first, fall back to config for backward compatibility.
    $default_provider_id = $this->state->get(self::STATE_DEFAULT_PROVIDER);
    if (empty($default_provider_id)) {
      $default_provider_id = $this->settings->get('default_provider');
    }

    if (empty($default_provider_id)) {
      // If no default set, try to get the first configured provider.
      $configured = $this->getEnabledProviders();

      if (!empty($configured)) {
        return reset($configured);
      }

      return NULL;
    }

    if (isset($this->providers[$default_provider_id])) {
      $provider = $this->providers[$default_provider_id];

      if ($provider->isConfigured()) {
        return $provider;
      }
    }

    return NULL;
  }

  /**
   * Gets all configured providers.
   *
   * @return array
   *   An array of provider instances that are configured.
   */
  public function getEnabledProviders(): array {
    $enabled_providers = [];

    foreach ($this->providers as $id => $provider) {
      if ($provider->isConfigured()) {
        $enabled_providers[$id] = $provider;
      }
    }

    return $enabled_providers;
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured(): bool {
    return $this->getDefaultProvider() !== NULL;
  }

  /**
   * {@inheritdoc}
   */
  public function sendSms(string $to, string $message, array $options = []): array {
    try {
      if (!$this->isConfigured()) {
        throw new \Exception('SMS service is not configured. Please configure at least one SMS provider.');
      }

      // Get the provider to use.
      $provider = $this->selectProvider($options);

      if (!$provider) {
        throw new \Exception('No SMS provider available.');
      }

      // Validate and normalize phone number.
      $validation_result = $this->phoneValidation->validate($to);

      if (!$validation_result['valid']) {
        throw new \Exception(implode(' ', $validation_result['violations']));
      }

      $to = $this->phoneValidation->normalize($to);

      // Validate message content.
      if (empty(trim($message))) {
        throw new \Exception('Message content cannot be empty.');
      }

      $this->logger->info('Attempting to send SMS via @provider to @to', [
        '@provider' => $provider->getName(),
        '@to' => $to,
      ]);

      // Send the message.
      $message_id = $provider->sendSms($to, $message);

      $this->logger->info('SMS sent successfully via @provider. Message ID: @id', [
        '@provider' => $provider->getName(),
        '@id' => $message_id,
      ]);

      return [
        'success' => TRUE,
        'message' => $this->t('Message sent successfully'),
        'message_id' => $message_id,
        'provider' => $provider->getId(),
      ];
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to send SMS: @error', [
        '@error' => $e->getMessage(),
      ]);

      return [
        'success' => FALSE,
        'message' => $e->getMessage(),
        'message_id' => NULL,
        'provider' => NULL,
      ];
    }
  }

  /**
   * Selects the appropriate provider for sending.
   *
   * @param array $options
   *   Sending options that may include a specific provider.
   *
   * @return \Drupal\sms_providers\Provider\SmsProviderInterface|null
   *   The selected provider or NULL if none available.
   */
  protected function selectProvider(array $options = []): ?SmsProviderInterface {
    // If a specific provider is requested, use it.
    if (!empty($options['provider']) && isset($this->providers[$options['provider']])) {
      $provider = $this->providers[$options['provider']];

      if ($provider->isConfigured()) {
        return $provider;
      }
    }

    // Otherwise, use the default provider.
    return $this->getDefaultProvider();
  }

}
