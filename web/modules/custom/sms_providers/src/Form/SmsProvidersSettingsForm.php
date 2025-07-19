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

    $form[self::CONFIG_DEFAULT_PROVIDER] = [
      '#type' => 'select',
      '#title' => $this->t('Default SMS Provider'),
      '#description' => $this->t('Select the default SMS provider to use for sending messages.'),
      '#options' => ['' => $this->t('- None -')] + $this->providerManager->getProviderOptions(),
      '#default_value' => $default_provider,
    ];

    // Add test message section.
    $form['test_message'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Test Message'),
      '#description' => $this->t('Send a test message using the selected default provider.'),
    ];

    $selected_provider = $default_provider;

    if (!empty($selected_provider)) {
      $provider = $this->providerManager->getProvider($selected_provider);

      if ($provider && $provider->isConfigured()) {
        $form['test_message']['test_phone'] = [
          '#type' => 'tel',
          '#title' => $this->t('Phone Number'),
          '#description' => $this->t('Enter a phone number to send the test message to (e.g., +254712345678).'),
          '#placeholder' => '+254712345678',
        ];

        $form['test_message']['test_message_content'] = [
          '#type' => 'textarea',
          '#title' => $this->t('Test Message'),
          '#description' => $this->t('Enter the test message content.'),
          '#default_value' => 'This is a test message from ' . $provider->getLabel() . '.',
          '#rows' => 3,
          '#maxlength' => 160,
        ];

        $form['test_message']['send_test'] = [
          '#type' => 'submit',
          '#value' => $this->t('Send Test Message'),
          '#submit' => ['::sendTestMessage'],
          '#validate' => ['::validateTestMessage'],
          '#button_type' => 'primary',
          '#attributes' => [
            'class' => ['button--small'],
          ],
        ];

        $form['test_message']['provider_info'] = [
          '#markup' => '<p><strong>' . $this->t('Using provider: @provider', ['@provider' => $provider->getLabel()]) . '</strong></p>',
        ];
      }
      else {
        $form['test_message']['not_configured'] = [
          '#markup' => '<p>' . $this->t('The selected provider is not properly configured. Configure the provider settings below to enable test messaging.') . '</p>',
        ];
      }
    }
    else {
      $form['test_message']['no_provider'] = [
        '#markup' => '<p>' . $this->t('Select a default provider above to enable test messaging.') . '</p>',
      ];
    }

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
        $is_default = $plugin_id === $default_provider;
        $title = $provider->getLabel();

        // Indicate which provider is the default and that its
        // configuration is required.
        if ($is_default) {
          $title .= ' ' . $this->t('(Default - Configuration Required)');
        }

        // Open the default provider's configuration by default.
        $form['providers'][$plugin_id] = [
          '#type' => 'details',
          '#title' => $title,
          '#open' => $is_default,
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
   * Sends a test message using the selected provider.
   *
   * @param array $form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function sendTestMessage(array &$form, FormStateInterface $form_state): void {
    $phone = $form_state->getValue('test_phone');
    $message = $form_state->getValue('test_message_content');
    $provider_id = $form_state->getValue(self::CONFIG_DEFAULT_PROVIDER);

    $provider = $this->providerManager->getProvider($provider_id);

    if (!$provider) {
      $this->messenger()->addError($this->t('Could not load the selected SMS provider.'));

      return;
    }

    $result = $provider->sendSms($phone, $message, ['test_mode' => TRUE]);

    if ($result['success']) {
      // Prepare response data for display.
      $response_data = '';

      if (isset($result['provider_response'])) {
        $response_data = ' Response data: ' . json_encode($result['provider_response'], \JSON_PRETTY_PRINT);
      }

      $this->messenger()->addStatus($this->t('Test message sent successfully via @provider! Message ID: @id@response', [
        '@provider' => $provider->getLabel(),
        '@id' => $result['message_id'] ?? 'N/A',
        '@response' => $response_data,
      ]));
    }
    else {
      // Prepare response data for debugging.
      $response_data = '';

      if (isset($result['provider_response'])) {
        $response_data = ' Response data: ' . json_encode($result['provider_response'], \JSON_PRETTY_PRINT);
      }
      elseif (isset($result['response_body'])) {
        $response_data = ' Response body: ' . $result['response_body'];
      }

      $this->messenger()->addError($this->t('Failed to send test message via @provider: @error@response', [
        '@provider' => $provider->getLabel(),
        '@error' => $result['message'] ?? 'Unknown error',
        '@response' => $response_data,
      ]));
    }

    // Don't redirect after test message - stay on the form.
    $form_state->setRebuild(TRUE);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $config = $this->config('sms_providers.settings');

    // Save general settings.
    $default_provider = $form_state->getValue(self::CONFIG_DEFAULT_PROVIDER) ?? '';

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

    // Get the selected default provider.
    $default_provider = $form_state->getValue(self::CONFIG_DEFAULT_PROVIDER);

    // Only validate provider configurations if they are selected as the
    // default. This allows administrators to save incomplete configurations
    // for providers they're not currently using.
    if (!empty($default_provider)) {
      $provider_values = $form_state->getValue('providers') ?: [];

      // Only validate the configuration for the selected default provider.
      if (isset($provider_values[$default_provider])
          && \is_array($provider_values[$default_provider])) {
        $values = $provider_values[$default_provider];
        $provider = $this->providerManager->getProvider($default_provider);

        if ($provider && isset($form['providers'][$default_provider])) {
          // Create a temporary form state with the provider's values.
          $provider_form_state = clone $form_state;
          $provider_form_state->setValues($values);

          $provider->validateConfigurationForm($form['providers'][$default_provider], $provider_form_state);

          // Copy any errors back to the main form state.
          foreach ($provider_form_state->getErrors() as $name => $message) {
            $form_state->setErrorByName("providers][{$default_provider}][{$name}", $message);
          }
        }
      }
    }
  }

  /**
   * Validates the test message form.
   *
   * @param array $form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function validateTestMessage(array &$form, FormStateInterface $form_state): void {
    $phone = $form_state->getValue('test_phone');
    $message = $form_state->getValue('test_message_content');
    $provider_id = $form_state->getValue(self::CONFIG_DEFAULT_PROVIDER);

    if (empty($phone)) {
      $form_state->setErrorByName('test_phone', $this->t('Phone number is required.'));
    }
    elseif (!preg_match('/^\+?[1-9]\d{8,14}$/', $phone)) {
      $form_state->setErrorByName('test_phone', $this->t('Please enter a valid phone number (e.g., +254712345678).'));
    }

    if (empty(trim($message))) {
      $form_state->setErrorByName('test_message_content', $this->t('Test message content is required.'));
    }

    if (empty($provider_id)) {
      $form_state->setErrorByName('test_phone', $this->t('Please select a default provider first.'));

      return;
    }

    $provider = $this->providerManager->getProvider($provider_id);

    if (!$provider || !$provider->isConfigured()) {
      $form_state->setErrorByName('test_phone', $this->t('The selected provider is not properly configured.'));
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
