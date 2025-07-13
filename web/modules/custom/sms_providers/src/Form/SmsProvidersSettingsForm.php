<?php

namespace Drupal\sms_providers\Form;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\TypedConfigManagerInterface;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\sms_providers\Plugin\SmsProviderManager;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configure SMS Providers settings for this site.
 */
class SmsProvidersSettingsForm extends ConfigFormBase {

  // Configuration keys.
  public const CONFIG_DEFAULT_PROVIDER = 'default_provider';

  /**
   * The logger channel.
   */
  protected LoggerChannelInterface $logger;

  /**
   * The SMS provider plugin manager.
   */
  protected SmsProviderManager $providerManager;

  /**
   * Constructs a SmsProvidersSettingsForm object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The factory for configuration objects.
   * @param \Drupal\Core\Config\TypedConfigManagerInterface $typed_config_manager
   *   The typed config manager.
   * @param \Drupal\sms_providers\Plugin\SmsProviderManager $provider_manager
   *   The SMS provider plugin manager.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    TypedConfigManagerInterface $typed_config_manager,
    SmsProviderManager $provider_manager,
    LoggerChannelFactoryInterface $logger_factory,
  ) {
    parent::__construct($config_factory, $typed_config_manager);
    $this->providerManager = $provider_manager;
    $this->logger = $logger_factory->get('sms_providers');
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('sms_providers.settings');
    $default_provider = $config->get(self::CONFIG_DEFAULT_PROVIDER);

    // Debug logging to see what we're loading as default.
    $this->logger->info('Form build debug - Default provider from config: @provider', [
      '@provider' => $default_provider ?: 'NULL/EMPTY',
    ]);

    $form[self::CONFIG_DEFAULT_PROVIDER] = [
      '#type' => 'select',
      '#title' => $this->t('Default SMS Provider'),
      '#description' => $this->t('Select the default SMS provider to use for sending messages.'),
      '#options' => ['' => $this->t('- None -')] + $this->providerManager->getProviderOptions(),
      '#default_value' => $default_provider,
    ];

    // Add provider configuration sections.
    $form['providers'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Provider Configuration'),
      '#tree' => TRUE,
    ];

    $definitions = $this->providerManager->getDefinitions();

    foreach ($definitions as $plugin_id => $definition) {
      $provider = $this->providerManager->getProvider($plugin_id);

      if ($provider) {
        $form['providers'][$plugin_id] = [
          '#type' => 'details',
          '#title' => $provider->getLabel(),
          '#open' => FALSE,
        ];

        $provider_form = $provider->buildConfigurationForm([], $form_state);
        $form['providers'][$plugin_id] += $provider_form;
      }
    }

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    /** @var \Drupal\Core\Config\ConfigFactoryInterface $config_factory */
    $config_factory = $container->get('config.factory');
    /** @var \Drupal\Core\Config\TypedConfigManagerInterface $typed_config_manager */
    $typed_config_manager = $container->get('config.typed');
    /** @var \Drupal\sms_providers\Plugin\SmsProviderManager $provider_manager */
    $provider_manager = $container->get('plugin.manager.sms_provider');
    /** @var \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory */
    $logger_factory = $container->get('logger.factory');

    return new static(
      $config_factory,
      $typed_config_manager,
      $provider_manager,
      $logger_factory
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'sms_providers_settings';
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $config = $this->config('sms_providers.settings');

    // Save general settings.
    $default_provider = $form_state->getValue(self::CONFIG_DEFAULT_PROVIDER) ?? '';

    // Debug logging to see what we're actually getting.
    $this->logger->info('Form submission debug - Default provider: @provider', [
      '@provider' => $default_provider,
    ]);

    $config
      ->set(self::CONFIG_DEFAULT_PROVIDER, $default_provider)
      ->save();

    // Save provider-specific configurations.
    $provider_values = $form_state->getValue('providers') ?: [];

    foreach ($provider_values as $plugin_id => $values) {
      if (!\is_array($values)) {
        continue;
      }

      $provider = $this->providerManager->getProvider($plugin_id);

      if ($provider && isset($form['providers'][$plugin_id])) {
        // Create a temporary form state with the provider's values.
        $provider_form_state = clone $form_state;
        $provider_form_state->setValues($values);

        $provider->submitConfigurationForm($form['providers'][$plugin_id], $provider_form_state);

        // Save the provider configuration.
        $provider_config = $this->configFactory->getEditable("sms_providers.provider.{$plugin_id}");
        $provider_config->setData($provider->getConfiguration())->save();
      }
    }

    parent::submitForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    parent::validateForm($form, $form_state);

    // Validate provider-specific configurations.
    $provider_values = $form_state->getValue('providers') ?: [];

    foreach ($provider_values as $plugin_id => $values) {
      if (!\is_array($values)) {
        continue;
      }

      $provider = $this->providerManager->getProvider($plugin_id);

      if ($provider && isset($form['providers'][$plugin_id])) {
        // Create a temporary form state with the provider's values.
        $provider_form_state = clone $form_state;
        $provider_form_state->setValues($values);

        $provider->validateConfigurationForm($form['providers'][$plugin_id], $provider_form_state);

        // Copy any errors back to the main form state.
        foreach ($provider_form_state->getErrors() as $name => $message) {
          $form_state->setErrorByName("providers][{$plugin_id}][{$name}", $message);
        }
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    $configs = ['sms_providers.settings'];

    // Add provider-specific configurations.
    $definitions = $this->providerManager->getDefinitions();

    foreach ($definitions as $plugin_id => $definition) {
      $configs[] = "sms_providers.provider.{$plugin_id}";
    }

    return $configs;
  }

}
