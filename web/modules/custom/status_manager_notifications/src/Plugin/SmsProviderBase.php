<?php

namespace Drupal\status_manager_notifications\Plugin;

use Drupal\Core\Form\FormStateInterface;
use Drupal\status_manager\Entity\StatusChangeInterface;

/**
 * Base class for SMS notification provider plugins.
 */
abstract class SmsProviderBase extends NotificationProviderBase {

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration() {
    return parent::defaultConfiguration() + [
      'from_number' => '',
      'api_key' => '',
      'api_secret' => '',
      'max_length' => 160,
    ];
  }

  /**
   * {@inheritdoc}
   */
  protected function getRecipient(StatusChangeInterface $status_change, array $options = []) {
    // Check if phone is provided in options.
    if (!empty($options['recipient'])) {
      return $this->normalizePhoneNumber($options['recipient']);
    }

    // Try to get phone from the target entity.
    $target_entity = $status_change->getTargetEntity();
    if ($target_entity) {
      // Check common phone fields.
      $phone_fields = ['phone', 'field_phone', 'field_mobile', 'field_phone_number', 'field_contact_phone'];

      foreach ($phone_fields as $field_name) {
        if ($target_entity->hasField($field_name) && !$target_entity->get($field_name)->isEmpty()) {
          $phone = $target_entity->get($field_name)->value;
          return $this->normalizePhoneNumber($phone);
        }
      }

      // Try to get phone from entity owner.
      if (method_exists($target_entity, 'getOwner')) {
        $owner = $target_entity->getOwner();
        if ($owner) {
          foreach ($phone_fields as $field_name) {
            if ($owner->hasField($field_name) && !$owner->get($field_name)->isEmpty()) {
              $phone = $owner->get($field_name)->value;
              return $this->normalizePhoneNumber($phone);
            }
          }
        }
      }
    }

    return NULL;
  }

  /**
   * Normalizes a phone number to international format.
   *
   * @param string $phone
   *   The phone number to normalize.
   *
   * @return string
   *   The normalized phone number.
   */
  protected function normalizePhoneNumber($phone) {
    // Remove all non-numeric characters except +.
    $phone = preg_replace('/[^0-9+]/', '', $phone);

    // If it doesn't start with +, assume it needs country code.
    if (strpos($phone, '+') !== 0) {
      // This is a simple implementation. In production, you'd want
      // to use a proper phone number library or configuration.
      $default_country_code = $this->getDefaultCountryCode();
      $phone = $default_country_code . $phone;
    }

    return $phone;
  }

  /**
   * Gets the default country code for phone numbers.
   *
   * @return string
   *   The default country code (e.g., '+1', '+254').
   */
  protected function getDefaultCountryCode() {
    // This could be made configurable.
    // Kenya.
    return '+254';
  }

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state) {
    $form = parent::buildConfigurationForm($form, $form_state);

    $form['from_number'] = [
      '#type' => 'textfield',
      '#title' => $this->t('From phone number'),
      '#description' => $this->t('The phone number to send SMS from (if supported by provider).'),
      '#default_value' => $this->configuration['from_number'],
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('API Key'),
      '#description' => $this->t('Your SMS provider API key.'),
      '#default_value' => $this->configuration['api_key'],
      '#required' => TRUE,
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
        'required' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['api_secret'] = [
      '#type' => 'password',
      '#title' => $this->t('API Secret'),
      '#description' => $this->t('Your SMS provider API secret. Leave empty to keep existing value.'),
      '#states' => [
        'visible' => [
          ':input[name="enabled"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['max_length'] = [
      '#type' => 'number',
      '#title' => $this->t('Maximum message length'),
      '#description' => $this->t('Maximum number of characters per SMS message.'),
      '#default_value' => $this->configuration['max_length'],
      '#min' => 70,
      '#max' => 1600,
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

    if ($form_state->getValue('enabled')) {
      $from_number = $form_state->getValue('from_number');
      if (!empty($from_number) && !preg_match('/^\+?[1-9]\d{1,14}$/', $from_number)) {
        $form_state->setErrorByName('from_number', $this->t('Invalid phone number format.'));
      }

      if (empty($form_state->getValue('api_key'))) {
        $form_state->setErrorByName('api_key', $this->t('API key is required when provider is enabled.'));
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state) {
    parent::submitConfigurationForm($form, $form_state);
    $this->configuration['from_number'] = $form_state->getValue('from_number');
    $this->configuration['api_key'] = $form_state->getValue('api_key');
    $this->configuration['max_length'] = $form_state->getValue('max_length');

    // Only update API secret if a new value was provided.
    $api_secret = $form_state->getValue('api_secret');
    if (!empty($api_secret)) {
      $this->configuration['api_secret'] = $api_secret;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function testConfiguration($recipient) {
    $message = $this->t('Test SMS from @provider. Your SMS configuration is working correctly.', [
      '@provider' => $this->pluginDefinition['label'],
    ]);

    return $this->sendCustomMessage($recipient, $message);
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured() {
    return !empty($this->configuration['enabled']) && !empty($this->configuration['api_key']);
  }

  /**
   * Truncates a message to fit SMS length limits.
   *
   * @param string $message
   *   The message to truncate.
   *
   * @return string
   *   The truncated message.
   */
  protected function truncateMessage($message) {
    $max_length = $this->configuration['max_length'] ?? 160;
    if (mb_strlen($message) > $max_length) {
      // Leave room for ellipsis.
      $message = mb_substr($message, 0, $max_length - 3) . '...';
    }
    return $message;
  }

}
