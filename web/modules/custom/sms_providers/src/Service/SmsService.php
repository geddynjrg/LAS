<?php

namespace Drupal\sms_providers\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\sms_providers\Plugin\SmsProviderBase;
use Drupal\sms_providers\Plugin\SmsProviderInterface;
use Drupal\sms_providers\Plugin\SmsProviderManager;

/**
 * SMS service for unified SMS sending across providers.
 */
class SmsService implements SmsServiceInterface {

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
   * The SMS provider plugin manager.
   */
  protected SmsProviderManager $providerManager;

  /**
   * SMS service settings.
   */
  protected ImmutableConfig $settings;

  /**
   * Constructs an SmsService object.
   *
   * @param \Drupal\sms_providers\Plugin\SmsProviderManager $provider_manager
   *   The SMS provider plugin manager.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(
    SmsProviderManager $provider_manager,
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
  ) {
    $this->providerManager = $provider_manager;
    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get(SmsProviderBase::LOGGER_CHANNEL);
    $this->settings = $config_factory->get('sms_providers.settings');
  }

  /**
   * {@inheritdoc}
   */
  public function getDefaultProvider(): ?SmsProviderInterface {
    return $this->providerManager->getDefaultProvider();
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
    if (!$this->isConfigured()) {
      return [
        'success' => FALSE,
        'message' => $this->t('SMS service is not configured. Please configure at least one SMS provider.'),
        'message_id' => NULL,
        'provider' => NULL,
      ];
    }

    // Get the provider to use.
    $provider = $this->selectProvider($options);

    if (!$provider) {
      return [
        'success' => FALSE,
        'message' => $this->t('No SMS provider available.'),
        'message_id' => NULL,
        'provider' => NULL,
      ];
    }

    $this->logger->info('Attempting to send SMS via @provider to @to', [
      '@provider' => $provider->getLabel(),
      '@to' => $to,
    ]);

    // Attempt to send via primary provider.
    $result = $provider->sendSms($to, $message, $options);
    $result['provider'] = $provider->getProviderId();

    // Log the final result.
    if ($result['success']) {
      $this->logger->info('SMS sent successfully via @provider. Message ID: @id', [
        '@provider' => $result['provider'],
        '@id' => $result['message_id'] ?? 'unknown',
      ]);
    }
    else {
      $this->logger->error('Failed to send SMS after all attempts: @error', [
        '@error' => $result['message'],
      ]);
    }

    return $result;
  }

  /**
   * Selects the appropriate provider for sending.
   *
   * @param array $options
   *   Sending options that may include a specific provider.
   *
   * @return \Drupal\sms_providers\Plugin\SmsProviderInterface|null
   *   The selected provider or NULL if none available.
   */
  protected function selectProvider(array $options = []): ?SmsProviderInterface {
    // If a specific provider is requested, use it.
    if (!empty($options['provider'])) {
      $provider = $this->providerManager->getProvider($options['provider']);

      if ($provider && $provider->isConfigured()) {
        $config = $provider->getConfiguration();

        if (!empty($config['enabled'])) {
          return $provider;
        }
      }
    }

    // Otherwise, use the default provider.
    return $this->getDefaultProvider();
  }

}
