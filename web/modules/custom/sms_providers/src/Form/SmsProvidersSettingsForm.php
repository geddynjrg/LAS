<?php

namespace Drupal\sms_providers\Form;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\TypedConfigManagerInterface;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\sms_providers\Service\SmsService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configure SMS Providers settings for this site.
 */
class SmsProvidersSettingsForm extends ConfigFormBase {

  // Configuration keys.
  public const CONFIG_DEFAULT_PROVIDER = 'default_provider';

  /**
   * The SMS service.
   */
  protected SmsService $smsService;

  /**
   * Constructs a SmsProvidersSettingsForm object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The factory for configuration objects.
   * @param \Drupal\Core\Config\TypedConfigManagerInterface $typed_config_manager
   *   The typed config manager.
   * @param \Drupal\sms_providers\Service\SmsService $sms_service
   *   The SMS service.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    TypedConfigManagerInterface $typed_config_manager,
    SmsService $sms_service,
  ) {
    parent::__construct($config_factory, $typed_config_manager);
    $this->smsService = $sms_service;
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('sms_providers.settings');

    // Get provider options from available providers.
    $provider_options = [];

    foreach ($this->smsService->getAllProviders() as $id => $provider) {
      $provider_options[$id] = $provider->getName();
    }

    if (empty($provider_options)) {
      $form['no_providers'] = [
        '#markup' => '<div class="messages messages--warning">' . $this->t('No SMS providers are currently available. Install and configure provider modules to send SMS messages.') . '</div>',
      ];
    }
    else {
      $form[self::CONFIG_DEFAULT_PROVIDER] = [
        '#type' => 'select',
        '#title' => $this->t('Default SMS Provider'),
        '#description' => $this->t('Select the default SMS provider to use for sending messages.'),
        '#options' => ['' => $this->t('- None -')] + $provider_options,
        '#default_value' => $config->get(self::CONFIG_DEFAULT_PROVIDER),
      ];
    }

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new static(
      $container->get('config.factory'),
      $container->get('config.typed'),
      $container->get('sms_providers.sms_service')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'sms_providers_settings_form';
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $config = $this->config('sms_providers.settings');

    // Only save default provider selection.
    $config->set(self::CONFIG_DEFAULT_PROVIDER, $form_state->getValue(self::CONFIG_DEFAULT_PROVIDER));
    $config->save();

    parent::submitForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return [
      'sms_providers.settings',
    ];
  }

}
