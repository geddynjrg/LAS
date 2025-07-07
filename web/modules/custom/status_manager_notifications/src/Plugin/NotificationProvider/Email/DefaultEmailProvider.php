<?php

namespace Drupal\status_manager_notifications\Plugin\NotificationProvider\Email;

use Drupal\status_manager_notifications\Plugin\EmailProviderBase;
use Drupal\status_manager\Entity\StatusChangeInterface;

/**
 * Provides a default email notification provider using Drupal's mail system.
 *
 * @NotificationProvider(
 *   id = "default_email",
 *   label = @Translation("Default Email Provider"),
 *   description = @Translation("Uses Drupal's built-in mail system to send email notifications."),
 *   type = "email",
 *   weight = 0
 * )
 */
class DefaultEmailProvider extends EmailProviderBase {

  /**
   * {@inheritdoc}
   */
  public function isConfigured() {
    // Default provider is always configured if enabled.
    return !empty($this->configuration['enabled']);
  }

  /**
   * {@inheritdoc}
   */
  protected function sendTemplatedMessage(StatusChangeInterface $status_change, array $options = []) {
    $recipient = $this->getRecipient($status_change, $options);
    if (!$recipient) {
      return [
        'success' => FALSE,
        'message' => $this->t('No recipient email address found.'),
      ];
    }

    // Get template service.
    $template_service = \Drupal::service('status_manager_notifications.template_manager');
    $template = $template_service->getTemplate('email', $status_change, $options['template_id'] ?? NULL);

    if (!$template) {
      return [
        'success' => FALSE,
        'message' => $this->t('No email template found for this status change.'),
      ];
    }

    // Get token service.
    $token_service = \Drupal::service('status_manager_notifications.token_service');

    // Prepare token data.
    $token_data = [
      'status_change' => $status_change,
      'target_entity' => $status_change->getTargetEntity(),
      'user' => $status_change->getOwner(),
    ];

    if (!empty($options['additional_data'])) {
      $token_data = array_merge($token_data, $options['additional_data']);
    }

    // Replace tokens in template.
    $subject = $token_service->replace($template['subject'], $token_data);
    $body = $token_service->replace($template['body'], $token_data);

    // Prepare mail parameters.
    $params = [
      'subject' => $subject,
      'body' => $body,
      'format' => $this->configuration['use_html'] ? 'text/html' : 'text/plain',
      'headers' => [],
    ];

    // Set from name if configured.
    if (!empty($this->configuration['from_name'])) {
      $from = sprintf('%s <%s>', $this->configuration['from_name'], $this->getFromEmail());
    }
    else {
      $from = $this->getFromEmail();
    }

    // Use the from email directly - no Reply-To handling to avoid conflicts.
    $mail_from = $from;

    $langcode = \Drupal::languageManager()->getDefaultLanguage()->getId();

    // Send the email.
    $result = $this->mailManager->mail(
      'status_manager_notifications',
      'status_change_notification',
      $recipient,
      $langcode,
      $params,
      $mail_from
    );

    if ($result['result']) {
      $this->log('info', 'Email sent successfully to @recipient', ['@recipient' => $recipient]);
      return [
        'success' => TRUE,
        'message' => $this->t('Email sent successfully to @recipient', ['@recipient' => $recipient]),
      ];
    }
    else {
      $this->log('error', 'Failed to send email to @recipient', ['@recipient' => $recipient]);
      return [
        'success' => FALSE,
        'message' => $this->t('Failed to send email to @recipient', ['@recipient' => $recipient]),
      ];
    }
  }

  /**
   * {@inheritdoc}
   */
  public function sendCustomMessage($recipient, $message, array $options = []) {
    $subject = $options['subject'] ?? $this->t('Notification from @site', [
      '@site' => $this->configFactory->get('system.site')->get('name'),
    ]);

    $params = [
      'subject' => $subject,
      'body' => $message,
      'format' => $this->configuration['use_html'] ? 'text/html' : 'text/plain',
      'headers' => [],
    ];

    // Set from name if configured.
    if (!empty($this->configuration['from_name'])) {
      $from = sprintf('%s <%s>', $this->configuration['from_name'], $this->getFromEmail());
    }
    else {
      $from = $this->getFromEmail();
    }

    // Use the from email directly - no Reply-To handling to avoid conflicts.
    $mail_from = $from;

    $langcode = \Drupal::languageManager()->getDefaultLanguage()->getId();

    // Send the email.
    $result = $this->mailManager->mail(
      'status_manager_notifications',
      'custom_message',
      $recipient,
      $langcode,
      $params,
      $mail_from
    );

    if ($result['result']) {
      $this->log('info', 'Custom email sent successfully to @recipient', ['@recipient' => $recipient]);
      return [
        'success' => TRUE,
        'message' => $this->t('Email sent successfully to @recipient', ['@recipient' => $recipient]),
      ];
    }
    else {
      $this->log('error', 'Failed to send custom email to @recipient', ['@recipient' => $recipient]);
      return [
        'success' => FALSE,
        'message' => $this->t('Failed to send email to @recipient', ['@recipient' => $recipient]),
      ];
    }
  }

}
