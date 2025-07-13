<?php

namespace Drupal\sms_providers\Plugin;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\Plugin\DefaultPluginManager;
use Drupal\sms_providers\Form\SmsProvidersSettingsForm;

/**
 * Provides the SMS Provider plugin manager.
 */
class SmsProviderManager extends DefaultPluginManager {

  /**
   * The config factory.
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * The logger channel.
   */
  protected LoggerChannelInterface $logger;

  /**
   * Constructs a new SmsProviderManager object.
   *
   * @param \Traversable $namespaces
   *   An object that implements \Traversable which contains the root paths
   *   keyed by the corresponding namespace to look for plugin implementations.
   * @param \Drupal\Core\Cache\CacheBackendInterface $cache_backend
   *   Cache backend instance to use.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $module_handler
   *   The module handler to invoke the alter hook with.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(\Traversable $namespaces, CacheBackendInterface $cache_backend, ModuleHandlerInterface $module_handler, ConfigFactoryInterface $config_factory, LoggerChannelFactoryInterface $logger_factory) {
    parent::__construct(
      'Plugin/SmsProvider',
      $namespaces,
      $module_handler,
      'Drupal\sms_providers\Plugin\SmsProviderInterface',
      'Drupal\sms_providers\Annotation\SmsProvider'
    );

    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get(SmsProviderBase::LOGGER_CHANNEL);
    $this->alterInfo('sms_provider_info');
    $this->setCacheBackend($cache_backend, 'sms_provider_plugins');
  }

  /**
   * Gets the default SMS provider.
   *
   * @return \Drupal\sms_providers\Plugin\SmsProviderInterface|null
   *   The default provider instance or NULL if none configured.
   */
  public function getDefaultProvider(): ?SmsProviderInterface {
    $config = $this->configFactory->get('sms_providers.settings');
    $default_provider_id = $config->get(SmsProvidersSettingsForm::CONFIG_DEFAULT_PROVIDER);

    if (empty($default_provider_id)) {
      // If no default set, try to get the first enabled provider.
      $enabled = $this->getEnabledProviders();

      if (!empty($enabled)) {
        /** @var \Drupal\sms_providers\Plugin\SmsProviderInterface */
        return reset($enabled);
      }

      return NULL;
    }

    try {
      // Load provider-specific configuration.
      $provider_config = $this->configFactory->get("sms_providers.provider.{$default_provider_id}");
      $configuration = $provider_config->getRawData() ?: [];

      /** @var \Drupal\sms_providers\Plugin\SmsProviderInterface $instance */
      $instance = $this->createInstance($default_provider_id, $configuration);

      if ($instance->isConfigured()) {
        $config = $instance->getConfiguration();

        if (!empty($config['enabled'])) {
          return $instance;
        }
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to load default SMS provider @provider: @error', [
        '@provider' => $default_provider_id,
        '@error' => $e->getMessage(),
      ]);
    }

    return NULL;
  }

  /**
   * Gets all configured and enabled providers.
   *
   * @return array
   *   An array of provider instances that are configured and enabled.
   */
  public function getEnabledProviders(): array {
    $enabled_providers = [];
    $definitions = $this->getDefinitions();

    foreach ($definitions as $plugin_id => $definition) {
      try {
        // Load provider-specific configuration.
        $provider_config = $this->configFactory->get("sms_providers.provider.{$plugin_id}");
        $configuration = $provider_config->getRawData() ?: [];

        /** @var \Drupal\sms_providers\Plugin\SmsProviderInterface $instance */
        $instance = $this->createInstance($plugin_id, $configuration);

        if ($instance->isConfigured()) {
          $config = $instance->getConfiguration();

          if (!empty($config['enabled'])) {
            $enabled_providers[$plugin_id] = $instance;
          }
        }
      }
      catch (\Exception $e) {
        // Skip providers that fail to instantiate.
        $this->logger->error('Failed to instantiate SMS provider @provider: @error', [
          '@provider' => $plugin_id,
          '@error' => $e->getMessage(),
        ]);
      }
    }

    return $enabled_providers;
  }

  /**
   * Gets a provider instance by ID.
   *
   * @param string $provider_id
   *   The provider plugin ID.
   *
   * @return \Drupal\sms_providers\Plugin\SmsProviderInterface|null
   *   The provider instance or NULL if not found or not configured.
   */
  public function getProvider(string $provider_id): ?SmsProviderInterface {
    if (!$this->hasDefinition($provider_id)) {
      return NULL;
    }

    try {
      // Load provider-specific configuration.
      $provider_config = $this->configFactory->get("sms_providers.provider.{$provider_id}");
      $configuration = $provider_config->getRawData() ?: [];

      /** @var \Drupal\sms_providers\Plugin\SmsProviderInterface */
      return $this->createInstance($provider_id, $configuration);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to create SMS provider @provider: @error', [
        '@provider' => $provider_id,
        '@error' => $e->getMessage(),
      ]);

      return NULL;
    }
  }

  /**
   * Gets options array for form select elements.
   *
   * @param bool $enabled_only
   *   Whether to include only enabled providers.
   *
   * @return array
   *   An array suitable for form select options.
   */
  public function getProviderOptions(bool $enabled_only = FALSE): array {
    $options = [];

    if ($enabled_only) {
      $providers = $this->getEnabledProviders();

      foreach ($providers as $plugin_id => $instance) {
        $options[$plugin_id] = $instance->getLabel();
      }
    }
    else {
      $definitions = $this->getDefinitions();

      foreach ($definitions as $plugin_id => $definition) {
        $options[$plugin_id] = $definition['label'] ?? $plugin_id;
      }
    }

    return $options;
  }

}
