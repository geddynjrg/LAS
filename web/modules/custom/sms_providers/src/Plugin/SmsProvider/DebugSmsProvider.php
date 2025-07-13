<?php

namespace Drupal\sms_providers\Plugin\SmsProvider;

use Drupal\Core\Form\FormStateInterface;
use Drupal\sms_providers\Plugin\SmsProviderBase;

/**
 * Debug SMS provider that logs messages instead of sending them.
 *
 * @SmsProvider(
 *     id="debug",
 *     label=@Translation("Debug SMS Provider")
 * )
 */
class DebugSmsProvider extends SmsProviderBase {

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state): array {
    $form = parent::buildConfigurationForm($form, $form_state);

    $form['log_level'] = [
      '#type' => 'select',
      '#title' => $this->t('Log level'),
      '#description' => $this->t('The log level to use when logging SMS messages.'),
      '#options' => [
        'debug' => $this->t('Debug'),
        'info' => $this->t('Info'),
        'notice' => $this->t('Notice'),
        'warning' => $this->t('Warning'),
      ],
      '#default_value' => $this->configuration['log_level'] ?? 'info',
    ];

    $form['include_message_content'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Include message content in logs'),
      '#description' => $this->t('If checked, the actual message content will be included in the log entry. Disable for sensitive content.'),
      '#default_value' => $this->configuration['include_message_content'] ?? TRUE,
    ];

    $form['simulate_failures'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Simulate random failures'),
      '#description' => $this->t('If checked, the provider will randomly fail ~10% of the time to simulate real-world conditions.'),
      '#default_value' => $this->configuration['simulate_failures'] ?? FALSE,
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return parent::defaultConfiguration() + [
      'log_level' => 'info',
      'include_message_content' => TRUE,
      'simulate_failures' => FALSE,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured(): bool {
    return TRUE;
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state): void {
    parent::submitConfigurationForm($form, $form_state);
    $this->configuration['log_level'] = $form_state->getValue('log_level');
    $this->configuration['include_message_content'] = $form_state->getValue('include_message_content');
    $this->configuration['simulate_failures'] = $form_state->getValue('simulate_failures');
  }

  /**
   * {@inheritdoc}
   */
  protected function doSendSms(string $to, string $message, array $options = []): array {
    // Simulate random failures if enabled.
    if (!empty($this->configuration['simulate_failures']) && mt_rand(1, 10) === 1) {
      return [
        'success' => FALSE,
        'message' => $this->t('Simulated failure: Network timeout occurred'),
        'message_id' => NULL,
      ];
    }

    // Generate a fake message ID.
    $message_id = 'debug_' . uniqid();

    // Prepare log context.
    $context = [
      '@provider' => $this->getLabel(),
      '@to' => $to,
      '@message_id' => $message_id,
      'message_length' => \strlen($message),
    ];

    // Add message content to context if enabled.
    if (!empty($this->configuration['include_message_content'])) {
      $context['@message'] = $message;
      $log_message = 'SMS would be sent via @provider to @to (ID: @message_id): "@message"';
    }
    else {
      $log_message = 'SMS would be sent via @provider to @to (ID: @message_id, length: @length chars)';
      $context['@length'] = \strlen($message);
    }

    // Add any options to the context.
    if (!empty($options)) {
      $context['options'] = $options;
    }

    // Log the message at the configured level.
    $log_level = $this->configuration['log_level'] ?? 'info';
    $this->log($log_level, $log_message, $context);

    return [
      'success' => TRUE,
      'message' => $this->t('Message logged successfully'),
      'message_id' => $message_id,
    ];
  }

}
