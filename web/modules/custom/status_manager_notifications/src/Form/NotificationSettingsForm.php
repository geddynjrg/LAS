<?php

namespace Drupal\status_manager_notifications\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\status_manager_notifications\Service\NotificationManager;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configure Status Manager Notifications settings.
 */
class NotificationSettingsForm extends ConfigFormBase {

  /**
   * The notification manager.
   *
   * @var \Drupal\status_manager_notifications\Service\NotificationManager
   */
  protected $notificationManager;

  /**
   * Constructs a NotificationSettingsForm object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\status_manager_notifications\Service\NotificationManager $notification_manager
   *   The notification manager.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    NotificationManager $notification_manager,
  ) {
    parent::__construct($config_factory);
    $this->notificationManager = $notification_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('config.factory'),
      $container->get('status_manager_notifications.notification_manager')
    );
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return [
      'status_manager_notifications.settings',
      'status_manager_notifications.email',
      'status_manager_notifications.sms',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'status_manager_notifications_settings';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $general_config = $this->config('status_manager_notifications.settings');
    $email_config = $this->config('status_manager_notifications.email');
    $sms_config = $this->config('status_manager_notifications.sms');

    $form['#tree'] = TRUE;

    // General settings.
    $form['general'] = [
      '#type' => 'details',
      '#title' => $this->t('General Notification Settings'),
      '#open' => TRUE,
    ];

    $form['general']['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable notifications'),
      '#description' => $this->t('Master switch for all notifications.'),
      '#default_value' => $general_config->get('enabled') ?? TRUE,
    ];

    $form['general']['default_notification_type'] = [
      '#type' => 'select',
      '#title' => $this->t('Default notification type'),
      '#description' => $this->t('Default notification type for new status changes.'),
      '#options' => [
        'none' => $this->t('None'),
        'email' => $this->t('Email'),
        'sms' => $this->t('SMS'),
        'both' => $this->t('Email and SMS'),
      ],
      '#default_value' => $general_config->get('default_notification_type') ?? 'none',
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // Email settings.
    $form['email'] = [
      '#type' => 'details',
      '#title' => $this->t('Email Notification Settings'),
      '#open' => TRUE,
    ];

    $form['email']['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable email notifications'),
      '#default_value' => $email_config->get('enabled') ?? TRUE,
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['email']['from_email'] = [
      '#type' => 'email',
      '#title' => $this->t('From email address'),
      '#description' => $this->t('Email address to use as sender. Leave empty to use site default.'),
      '#default_value' => $email_config->get('from_email') ?? '',
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
          ':input[name="email[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['email']['reply_to'] = [
      '#type' => 'email',
      '#title' => $this->t('Reply-to email address'),
      '#description' => $this->t('Email address for replies. Leave empty to use from address.'),
      '#default_value' => $email_config->get('reply_to') ?? '',
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
          ':input[name="email[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['email']['use_html'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Use HTML format'),
      '#description' => $this->t('Send emails in HTML format instead of plain text.'),
      '#default_value' => $email_config->get('use_html') ?? TRUE,
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
          ':input[name="email[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['email']['include_attachments'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Include attachments'),
      '#description' => $this->t('Include relevant files as email attachments when available.'),
      '#default_value' => $email_config->get('include_attachments') ?? FALSE,
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
          ':input[name="email[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // SMS settings.
    $form['sms'] = [
      '#type' => 'details',
      '#title' => $this->t('SMS Notification Settings'),
      '#open' => FALSE,
    ];

    $form['sms']['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable SMS notifications'),
      '#default_value' => $sms_config->get('enabled') ?? FALSE,
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['sms']['provider'] = [
      '#type' => 'select',
      '#title' => $this->t('SMS provider'),
      '#description' => $this->t('Choose your SMS service provider.'),
      '#options' => [
        'twilio' => $this->t('Twilio'),
        'nexmo' => $this->t('Vonage (Nexmo)'),
        'custom' => $this->t('Custom implementation'),
      ],
      '#default_value' => $sms_config->get('provider') ?? 'twilio',
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
          ':input[name="sms[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['sms']['api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('API key'),
      '#description' => $this->t('Your SMS provider API key.'),
      '#default_value' => $sms_config->get('api_key') ?? '',
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
          ':input[name="sms[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['sms']['api_secret'] = [
      '#type' => 'password',
      '#title' => $this->t('API secret'),
      '#description' => $this->t('Your SMS provider API secret. Leave empty to keep existing value.'),
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
          ':input[name="sms[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['sms']['from_number'] = [
      '#type' => 'textfield',
      '#title' => $this->t('From phone number'),
      '#description' => $this->t('Phone number to send SMS from (e.g., +1234567890).'),
      '#default_value' => $sms_config->get('from_number') ?? '',
      '#states' => [
        'visible' => [
          ':input[name="general[enabled]"]' => ['checked' => TRUE],
          ':input[name="sms[enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // Test notifications section.
    $form['test'] = [
      '#type' => 'details',
      '#title' => $this->t('Test Notifications'),
      '#open' => FALSE,
    ];

    $form['test']['test_email'] = [
      '#type' => 'email',
      '#title' => $this->t('Test email address'),
      '#description' => $this->t('Send a test email to this address.'),
    ];

    $form['test']['test_phone'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Test phone number'),
      '#description' => $this->t('Send a test SMS to this number (e.g., +1234567890).'),
    ];

    $form['test']['send_test_email'] = [
      '#type' => 'submit',
      '#value' => $this->t('Send Test Email'),
      '#submit' => ['::sendTestEmail'],
      '#limit_validation_errors' => [['test', 'test_email']],
    ];

    $form['test']['send_test_sms'] = [
      '#type' => 'submit',
      '#value' => $this->t('Send Test SMS'),
      '#submit' => ['::sendTestSms'],
      '#limit_validation_errors' => [['test', 'test_phone']],
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);

    $values = $form_state->getValues();

    // Validate email settings.
    if ($values['email']['enabled']) {
      if (!empty($values['email']['from_email']) && !filter_var($values['email']['from_email'], FILTER_VALIDATE_EMAIL)) {
        $form_state->setErrorByName('email][from_email', $this->t('Invalid from email address.'));
      }

      if (!empty($values['email']['reply_to']) && !filter_var($values['email']['reply_to'], FILTER_VALIDATE_EMAIL)) {
        $form_state->setErrorByName('email][reply_to', $this->t('Invalid reply-to email address.'));
      }
    }

    // Validate SMS settings.
    if ($values['sms']['enabled']) {
      if (empty($values['sms']['api_key'])) {
        $form_state->setErrorByName('sms][api_key', $this->t('API key is required when SMS is enabled.'));
      }

      if (!empty($values['sms']['from_number']) && !preg_match('/^\+[1-9]\d{1,14}$/', $values['sms']['from_number'])) {
        $form_state->setErrorByName('sms][from_number', $this->t('Invalid phone number format. Use international format (e.g., +1234567890).'));
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $values = $form_state->getValues();

    // Save general settings.
    $this->config('status_manager_notifications.settings')
      ->set('enabled', $values['general']['enabled'])
      ->set('default_notification_type', $values['general']['default_notification_type'])
      ->save();

    // Save email settings.
    $email_config = $this->config('status_manager_notifications.email');
    $email_config
      ->set('enabled', $values['email']['enabled'])
      ->set('from_email', $values['email']['from_email'])
      ->set('reply_to', $values['email']['reply_to'])
      ->set('use_html', $values['email']['use_html'])
      ->set('include_attachments', $values['email']['include_attachments'])
      ->save();

    // Save SMS settings.
    $sms_config = $this->config('status_manager_notifications.sms');
    $sms_config
      ->set('enabled', $values['sms']['enabled'])
      ->set('provider', $values['sms']['provider'])
      ->set('api_key', $values['sms']['api_key'])
      ->set('from_number', $values['sms']['from_number'])
      ->save();

    // Only update API secret if a new value was provided.
    if (!empty($values['sms']['api_secret'])) {
      $sms_config->set('api_secret', $values['sms']['api_secret'])->save();
    }

    parent::submitForm($form, $form_state);
  }

  /**
   * Submit handler for test email.
   */
  public function sendTestEmail(array &$form, FormStateInterface $form_state) {
    $test_email = $form_state->getValue(['test', 'test_email']);

    if (empty($test_email)) {
      $this->messenger()->addError($this->t('Please enter a test email address.'));
      return;
    }

    // @todo Implement test email sending
    $this->messenger()->addMessage($this->t('Test email functionality will be implemented.'));
  }

  /**
   * Submit handler for test SMS.
   */
  public function sendTestSms(array &$form, FormStateInterface $form_state) {
    $test_phone = $form_state->getValue(['test', 'test_phone']);

    if (empty($test_phone)) {
      $this->messenger()->addError($this->t('Please enter a test phone number.'));
      return;
    }

    // @todo Implement test SMS sending
    $this->messenger()->addMessage($this->t('Test SMS functionality will be implemented.'));
  }

}
