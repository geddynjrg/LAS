<?php

namespace Drupal\status_manager_notifications\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\status_manager_notifications\Plugin\NotificationProviderManager;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for configuring notification providers.
 */
class NotificationProvidersForm extends ConfigFormBase {

  /**
   * The notification provider plugin manager.
   *
   * @var \Drupal\status_manager_notifications\Plugin\NotificationProviderManager
   */
  protected $providerManager;

  /**
   * Constructs a NotificationProvidersForm object.
   *
   * @param \Drupal\status_manager_notifications\Plugin\NotificationProviderManager $provider_manager
   *   The notification provider plugin manager.
   */
  public function __construct(NotificationProviderManager $provider_manager) {
    $this->providerManager = $provider_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('plugin.manager.notification_provider')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'status_manager_notifications_providers_form';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['status_manager_notifications.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('status_manager_notifications.settings');
    $providers_by_type = $this->providerManager->getProvidersByType();

    $form['#tree'] = TRUE;

    // Email providers section.
    if (!empty($providers_by_type['email'])) {
      $form['email'] = [
        '#type' => 'details',
        '#title' => $this->t('Email Providers'),
        '#open' => TRUE,
      ];

      $email_options = [];
      foreach ($providers_by_type['email'] as $id => $definition) {
        $email_options[$id] = $definition['label'];
      }

      $form['email']['active_provider'] = [
        '#type' => 'select',
        '#title' => $this->t('Active Email Provider'),
        '#options' => $email_options,
        '#default_value' => $config->get('email.active_provider'),
        '#empty_option' => $this->t('- None -'),
        '#description' => $this->t('Select the email provider to use for notifications.'),
      ];

      // Provider-specific configuration.
      foreach ($providers_by_type['email'] as $id => $definition) {
        $provider_config = $config->get("email.providers.{$id}") ?: [];

        $form['email']['providers'][$id] = [
          '#type' => 'details',
          '#title' => $definition['label'],
          '#open' => $config->get('email.active_provider') === $id,
          '#states' => [
            'visible' => [
              ':input[name="email[active_provider]"]' => ['value' => $id],
            ],
          ],
        ];

        // Let the provider build its configuration form.
        try {
          /** @var \Drupal\status_manager_notifications\Plugin\NotificationProviderInterface $provider */
          $provider = $this->providerManager->createInstance($id, $provider_config);
          $provider_form = $provider->buildConfigurationForm([], $form_state);

          if (!empty($provider_form)) {
            $form['email']['providers'][$id]['config'] = $provider_form;
            $form['email']['providers'][$id]['config']['#parents'] = ['email', 'providers', $id, 'config'];
          }

          // Add help text if available.
          $help_text = $provider->getHelpText();
          if ($help_text) {
            $form['email']['providers'][$id]['help'] = [
              '#markup' => '<div class="description">' . $help_text . '</div>',
              '#weight' => -10,
            ];
          }

          // Add test button.
          $form['email']['providers'][$id]['test'] = [
            '#type' => 'details',
            '#title' => $this->t('Test Configuration'),
            '#open' => FALSE,
            '#weight' => 100,
          ];

          $form['email']['providers'][$id]['test']['test_email'] = [
            '#type' => 'email',
            '#title' => $this->t('Test Email Address'),
            '#description' => $this->t('Enter an email address to send a test message.'),
          ];

          $form['email']['providers'][$id]['test']['send_test'] = [
            '#type' => 'submit',
            '#value' => $this->t('Send Test Email'),
            '#name' => "test_email_{$id}",
            '#submit' => ['::sendTestEmail'],
            '#limit_validation_errors' => [
              ['email', 'providers', $id, 'config'],
              ['email', 'providers', $id, 'test', 'test_email'],
            ],
            '#ajax' => [
              'callback' => '::testEmailCallback',
              'wrapper' => "test-result-{$id}",
            ],
          ];

          $form['email']['providers'][$id]['test']['result'] = [
            '#type' => 'container',
            '#attributes' => ['id' => "test-result-{$id}"],
          ];
        }
        catch (\Exception $e) {
          $form['email']['providers'][$id]['error'] = [
            '#markup' => '<div class="messages messages--error">' . $this->t('Error loading provider: @error', ['@error' => $e->getMessage()]) . '</div>',
          ];
        }
      }
    }

    // SMS providers section.
    if (!empty($providers_by_type['sms'])) {
      $form['sms'] = [
        '#type' => 'details',
        '#title' => $this->t('SMS Providers'),
        '#open' => TRUE,
      ];

      $sms_options = [];
      foreach ($providers_by_type['sms'] as $id => $definition) {
        $sms_options[$id] = $definition['label'];
      }

      $form['sms']['active_provider'] = [
        '#type' => 'select',
        '#title' => $this->t('Active SMS Provider'),
        '#options' => $sms_options,
        '#default_value' => $config->get('sms.active_provider'),
        '#empty_option' => $this->t('- None -'),
        '#description' => $this->t('Select the SMS provider to use for notifications.'),
      ];

      // Provider-specific configuration.
      foreach ($providers_by_type['sms'] as $id => $definition) {
        $provider_config = $config->get("sms.providers.{$id}") ?: [];

        $form['sms']['providers'][$id] = [
          '#type' => 'details',
          '#title' => $definition['label'],
          '#open' => $config->get('sms.active_provider') === $id,
          '#states' => [
            'visible' => [
              ':input[name="sms[active_provider]"]' => ['value' => $id],
            ],
          ],
        ];

        // Let the provider build its configuration form.
        try {
          /** @var \Drupal\status_manager_notifications\Plugin\NotificationProviderInterface $provider */
          $provider = $this->providerManager->createInstance($id, $provider_config);
          $provider_form = $provider->buildConfigurationForm([], $form_state);

          if (!empty($provider_form)) {
            $form['sms']['providers'][$id]['config'] = $provider_form;
            $form['sms']['providers'][$id]['config']['#parents'] = ['sms', 'providers', $id, 'config'];
          }

          // Add help text if available.
          $help_text = $provider->getHelpText();
          if ($help_text) {
            $form['sms']['providers'][$id]['help'] = [
              '#markup' => '<div class="description">' . $help_text . '</div>',
              '#weight' => -10,
            ];
          }

          // Add test button.
          $form['sms']['providers'][$id]['test'] = [
            '#type' => 'details',
            '#title' => $this->t('Test Configuration'),
            '#open' => FALSE,
            '#weight' => 100,
          ];

          $form['sms']['providers'][$id]['test']['test_phone'] = [
            '#type' => 'tel',
            '#title' => $this->t('Test Phone Number'),
            '#description' => $this->t('Enter a phone number to send a test message. Include country code (e.g., +254700000000).'),
          ];

          $form['sms']['providers'][$id]['test']['send_test'] = [
            '#type' => 'submit',
            '#value' => $this->t('Send Test SMS'),
            '#name' => "test_sms_{$id}",
            '#submit' => ['::sendTestSms'],
            '#limit_validation_errors' => [
              ['sms', 'providers', $id, 'config'],
              ['sms', 'providers', $id, 'test', 'test_phone'],
            ],
            '#ajax' => [
              'callback' => '::testSmsCallback',
              'wrapper' => "test-sms-result-{$id}",
            ],
          ];

          $form['sms']['providers'][$id]['test']['result'] = [
            '#type' => 'container',
            '#attributes' => ['id' => "test-sms-result-{$id}"],
          ];
        }
        catch (\Exception $e) {
          $form['sms']['providers'][$id]['error'] = [
            '#markup' => '<div class="messages messages--error">' . $this->t('Error loading provider: @error', ['@error' => $e->getMessage()]) . '</div>',
          ];
        }
      }
    }

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);

    // Skip validation if this is a test submission.
    $triggering_element = $form_state->getTriggeringElement();
    if ($triggering_element && (strpos($triggering_element['#name'], 'test_email_') === 0 || strpos($triggering_element['#name'], 'test_sms_') === 0)) {
      return;
    }

    // Validate email provider configurations.
    $email_provider = $form_state->getValue(['email', 'active_provider']);
    if ($email_provider && isset($form_state->getValue('email')['providers'][$email_provider])) {
      try {
        $config = $form_state->getValue(['email', 'providers', $email_provider, 'config']) ?: [];
        $provider = $this->providerManager->createInstance($email_provider, $config);
        $provider->setConfiguration($config);
        $provider->validateConfigurationForm($form['email']['providers'][$email_provider]['config'], $form_state);
      }
      catch (\Exception $e) {
        $form_state->setErrorByName('email', $this->t('Email provider validation error: @error', ['@error' => $e->getMessage()]));
      }
    }

    // Validate SMS provider configurations.
    $sms_provider = $form_state->getValue(['sms', 'active_provider']);
    if ($sms_provider && isset($form_state->getValue('sms')['providers'][$sms_provider])) {
      try {
        $config = $form_state->getValue(['sms', 'providers', $sms_provider, 'config']) ?: [];
        $provider = $this->providerManager->createInstance($sms_provider, $config);
        $provider->setConfiguration($config);
        $provider->validateConfigurationForm($form['sms']['providers'][$sms_provider]['config'], $form_state);
      }
      catch (\Exception $e) {
        $form_state->setErrorByName('sms', $this->t('SMS provider validation error: @error', ['@error' => $e->getMessage()]));
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('status_manager_notifications.settings');

    // Save email provider settings.
    $email_values = $form_state->getValue('email');
    $config->set('email.active_provider', $email_values['active_provider']);

    if (!empty($email_values['providers'])) {
      foreach ($email_values['providers'] as $id => $provider_values) {
        if (isset($provider_values['config'])) {
          // Let the provider process its configuration.
          try {
            $provider = $this->providerManager->createInstance($id);
            $provider->setConfiguration($provider_values['config']);
            $provider->submitConfigurationForm($form['email']['providers'][$id]['config'], $form_state);
            $config->set("email.providers.{$id}", $provider->getConfiguration());
          }
          catch (\Exception $e) {
            $this->messenger()->addError($this->t('Error saving email provider @id: @error', [
              '@id' => $id,
              '@error' => $e->getMessage(),
            ]));
          }
        }
      }
    }

    // Save SMS provider settings.
    $sms_values = $form_state->getValue('sms');
    $config->set('sms.active_provider', $sms_values['active_provider']);

    if (!empty($sms_values['providers'])) {
      foreach ($sms_values['providers'] as $id => $provider_values) {
        if (isset($provider_values['config'])) {
          // Let the provider process its configuration.
          try {
            $provider = $this->providerManager->createInstance($id);
            $provider->setConfiguration($provider_values['config']);
            $provider->submitConfigurationForm($form['sms']['providers'][$id]['config'], $form_state);
            $config->set("sms.providers.{$id}", $provider->getConfiguration());
          }
          catch (\Exception $e) {
            $this->messenger()->addError($this->t('Error saving SMS provider @id: @error', [
              '@id' => $id,
              '@error' => $e->getMessage(),
            ]));
          }
        }
      }
    }

    $config->save();

    parent::submitForm($form, $form_state);
  }

  /**
   * Submit handler for sending test emails.
   */
  public function sendTestEmail(array &$form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $provider_id = str_replace('test_email_', '', $triggering_element['#name']);

    $test_email = $form_state->getValue(['email', 'providers', $provider_id, 'test', 'test_email']);
    $config = $form_state->getValue(['email', 'providers', $provider_id, 'config']) ?: [];

    // Add enabled flag for testing.
    $config['enabled'] = TRUE;

    if ($test_email) {
      try {
        // Create provider with current form configuration.
        $provider = $this->providerManager->createInstance($provider_id, $config);
        $provider->setConfiguration($config);

        // Check if provider is properly configured.
        if (!$provider->isConfigured()) {
          $this->messenger()->addError($this->t('Provider is not properly configured. Please fill in all required fields before testing.'));
          return;
        }

        $result = $provider->testConfiguration($test_email);

        if ($result['success']) {
          $this->messenger()->addStatus($this->t('Test email sent successfully to @email', ['@email' => $test_email]));
        }
        else {
          $this->messenger()->addError($this->t('Failed to send test email: @error', ['@error' => $result['message']]));
        }
      }
      catch (\Exception $e) {
        $this->messenger()->addError($this->t('Error sending test email: @error', ['@error' => $e->getMessage()]));
      }
    }
    else {
      $this->messenger()->addError($this->t('Please enter a test email address.'));
    }
  }

  /**
   * Submit handler for sending test SMS.
   */
  public function sendTestSms(array &$form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $provider_id = str_replace('test_sms_', '', $triggering_element['#name']);

    $test_phone = $form_state->getValue(['sms', 'providers', $provider_id, 'test', 'test_phone']);
    $config = $form_state->getValue(['sms', 'providers', $provider_id, 'config']) ?: [];

    // Add enabled flag for testing.
    $config['enabled'] = TRUE;

    if ($test_phone) {
      try {
        // Create provider with current form configuration.
        $provider = $this->providerManager->createInstance($provider_id, $config);
        $provider->setConfiguration($config);

        // Check if provider is properly configured.
        if (!$provider->isConfigured()) {
          $this->messenger()->addError($this->t('Provider is not properly configured. Please fill in all required fields before testing.'));
          return;
        }

        $result = $provider->testConfiguration($test_phone);

        if ($result['success']) {
          $this->messenger()->addStatus($this->t('Test SMS sent successfully to @phone', ['@phone' => $test_phone]));
        }
        else {
          $this->messenger()->addError($this->t('Failed to send test SMS: @error', ['@error' => $result['message']]));
        }
      }
      catch (\Exception $e) {
        $this->messenger()->addError($this->t('Error sending test SMS: @error', ['@error' => $e->getMessage()]));
      }
    }
    else {
      $this->messenger()->addError($this->t('Please enter a test phone number.'));
    }
  }

  /**
   * Ajax callback for test email results.
   */
  public function testEmailCallback(array &$form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $provider_id = str_replace('test_email_', '', $triggering_element['#name']);
    return $form['email']['providers'][$provider_id]['test']['result'];
  }

  /**
   * Ajax callback for test SMS results.
   */
  public function testSmsCallback(array &$form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $provider_id = str_replace('test_sms_', '', $triggering_element['#name']);
    return $form['sms']['providers'][$provider_id]['test']['result'];
  }

}
