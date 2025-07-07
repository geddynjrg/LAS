<?php

namespace Drupal\status_manager_notifications\Plugin;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Mail\MailManagerInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Base class for Email notification provider plugins.
 */
abstract class EmailProviderBase extends NotificationProviderBase {

  /**
   * The mail manager.
   *
   * @var \Drupal\Core\Mail\MailManagerInterface
   */
  protected $mailManager;

  /**
   * Constructs an EmailProviderBase object.
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
   * @param \Drupal\Core\Mail\MailManagerInterface $mail_manager
   *   The mail manager.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
    MailManagerInterface $mail_manager,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $config_factory, $logger_factory);
    $this->mailManager = $mail_manager;
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
      $container->get('logger.factory'),
      $container->get('plugin.manager.mail')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration() {
    return parent::defaultConfiguration() + [
      'from_email' => '',
      'from_name' => '',
      'reply_to' => '',
      'use_html' => TRUE,
    ];
  }

  /**
   * {@inheritdoc}
   */
  protected function getRecipient(StatusChangeInterface $status_change, array $options = []) {
    // Check if email is provided in options.
    if (!empty($options['recipient'])) {
      return $options['recipient'];
    }

    // Try to get email from the target entity.
    $target_entity = $status_change->getTargetEntity();
    if ($target_entity) {
      // Check common email fields.
      $email_fields = ['mail', 'email', 'field_email', 'field_contact_email'];

      foreach ($email_fields as $field_name) {
        if ($target_entity->hasField($field_name) && !$target_entity->get($field_name)->isEmpty()) {
          return $target_entity->get($field_name)->value;
        }
      }

      // If target entity is a user, get the user's email.
      if ($target_entity->getEntityTypeId() === 'user') {
        return $target_entity->getEmail();
      }

      // Try to get email from entity owner.
      if (method_exists($target_entity, 'getOwner')) {
        $owner = $target_entity->getOwner();
        if ($owner) {
          return $owner->getEmail();
        }
      }
    }

    // Fallback to status change owner.
    $owner = $status_change->getOwner();
    if ($owner) {
      return $owner->getEmail();
    }

    return NULL;
  }

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state) {
    $form = parent::buildConfigurationForm($form, $form_state);

    $form['from_email'] = [
      '#type' => 'email',
      '#title' => $this->t('From email address'),
      '#description' => $this->t('The email address that will appear as the sender. Leave empty to use site default.'),
      '#default_value' => $this->configuration['from_email'],
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['from_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('From name'),
      '#description' => $this->t('The name that will appear as the sender. Leave empty to use site name.'),
      '#default_value' => $this->configuration['from_name'],
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['reply_to'] = [
      '#type' => 'email',
      '#title' => $this->t('Reply-to address'),
      '#description' => $this->t('Email address for replies. Leave empty to use from address.'),
      '#default_value' => $this->configuration['reply_to'],
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['use_html'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Send HTML emails'),
      '#description' => $this->t('If checked, emails will be sent in HTML format. Otherwise, plain text will be used.'),
      '#default_value' => $this->configuration['use_html'],
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateConfigurationForm(array &$form, FormStateInterface $form_state) {
    parent::validateConfigurationForm($form, $form_state);

    $from_email = $form_state->getValue('from_email');
    if (!empty($from_email) && !filter_var($from_email, FILTER_VALIDATE_EMAIL)) {
      $form_state->setErrorByName('from_email', $this->t('Invalid from email address.'));
    }

    $reply_to = $form_state->getValue('reply_to');
    if (!empty($reply_to) && !filter_var($reply_to, FILTER_VALIDATE_EMAIL)) {
      $form_state->setErrorByName('reply_to', $this->t('Invalid reply-to email address.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state) {
    parent::submitConfigurationForm($form, $form_state);
    $this->configuration['from_email'] = $form_state->getValue('from_email');
    $this->configuration['from_name'] = $form_state->getValue('from_name');
    $this->configuration['reply_to'] = $form_state->getValue('reply_to');
    $this->configuration['use_html'] = $form_state->getValue('use_html');
  }

  /**
   * {@inheritdoc}
   */
  public function testConfiguration($recipient) {
    $subject = $this->t('Test email from @provider', ['@provider' => $this->pluginDefinition['label']]);
    $message = $this->t('This is a test email to verify that @provider is configured correctly.', [
      '@provider' => $this->pluginDefinition['label'],
    ]);

    return $this->sendCustomMessage($recipient, $message, ['subject' => $subject]);
  }

  /**
   * Gets the from email address.
   *
   * @return string
   *   The from email address.
   */
  protected function getFromEmail() {
    return $this->configuration['from_email'] ?: $this->configFactory->get('system.site')->get('mail');
  }

  /**
   * Gets the from name.
   *
   * @return string
   *   The from name.
   */
  protected function getFromName() {
    return $this->configuration['from_name'] ?: $this->configFactory->get('system.site')->get('name');
  }

}
