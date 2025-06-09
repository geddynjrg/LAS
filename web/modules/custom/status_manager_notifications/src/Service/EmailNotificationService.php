<?php

namespace Drupal\status_manager_notifications\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Mail\MailManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Drupal\status_manager_notifications\NotificationInterface;

/**
 * Email notification service.
 */
class EmailNotificationService implements NotificationInterface {

  use StringTranslationTrait;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The mail manager.
   *
   * @var \Drupal\Core\Mail\MailManagerInterface
   */
  protected $mailManager;

  /**
   * The logger service.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * The email template service.
   *
   * @var \Drupal\status_manager_notifications\Service\EmailTemplateService
   */
  protected $templateService;

  /**
   * The token replacement service.
   *
   * @var \Drupal\status_manager_notifications\Service\TokenReplacementService
   */
  protected $tokenService;

  /**
   * Constructs an EmailNotificationService object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Mail\MailManagerInterface $mail_manager
   *   The mail manager.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   * @param \Drupal\status_manager_notifications\Service\EmailTemplateService $template_service
   *   The email template service.
   * @param \Drupal\status_manager_notifications\Service\TokenReplacementService $token_service
   *   The token replacement service.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    MailManagerInterface $mail_manager,
    LoggerChannelFactoryInterface $logger_factory,
    EmailTemplateService $template_service,
    TokenReplacementService $token_service,
  ) {
    $this->configFactory = $config_factory;
    $this->mailManager = $mail_manager;
    $this->logger = $logger_factory->get('status_manager_notifications');
    $this->templateService = $template_service;
    $this->tokenService = $token_service;
  }

  /**
   * {@inheritdoc}
   */
  public function sendNotification(StatusChangeInterface $status_change, array $options = []) {
    $config = $this->getConfiguration();

    if (!$this->isEnabled()) {
      return [
        'success' => FALSE,
        'message' => 'Email notifications are disabled',
      ];
    }

    // Get recipient email.
    $recipient_email = $this->getRecipientEmail($status_change, $options);
    if (!$recipient_email) {
      return [
        'success' => FALSE,
        'message' => 'No recipient email found',
      ];
    }

    // Get email template.
    $template = $this->templateService->getTemplate($status_change);
    if (!$template) {
      return [
        'success' => FALSE,
        'message' => 'No email template found',
      ];
    }

    // Replace tokens in template.
    $subject = $this->tokenService->replace($template['subject'], $status_change);
    $body = $this->tokenService->replace($template['body'], $status_change);

    // Prepare mail parameters.
    $params = [
      'subject' => $subject,
      'body' => $body,
      'status_change' => $status_change,
      'template' => $template,
    ];

    // @phpcs:disable
    $from = $config['from_email'] ?: \Drupal::config('system.site')->get('mail');
    $langcode = \Drupal::languageManager()->getDefaultLanguage()->getId();
    // @phpcs:enable

    // Send the email.
    $result = $this->mailManager->mail(
      'status_manager_notifications',
      'status_change_notification',
      $recipient_email,
      $langcode,
      $params,
      $from
    );

    if ($result['result']) {
      return [
        'success' => TRUE,
        'message' => $this->t('Email sent to @email', ['@email' => $recipient_email]),
      ];
    }
    else {
      return [
        'success' => FALSE,
        'message' => $this->t('Failed to send email to @email', ['@email' => $recipient_email]),
      ];
    }
  }

  /**
   * {@inheritdoc}
   */
  public function getNotificationType() {
    return 'email';
  }

  /**
   * {@inheritdoc}
   */
  public function isEnabled() {
    $config = $this->getConfiguration();
    return !empty($config['enabled']);
  }

  /**
   * {@inheritdoc}
   */
  public function getConfiguration() {
    return $this->configFactory->get('status_manager_notifications.email')->get() ?: [
      'enabled' => TRUE,
      'from_email' => '',
      'reply_to' => '',
      'use_html' => TRUE,
      'include_attachments' => FALSE,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function validateConfiguration(array $configuration) {
    $errors = [];

    if (!empty($configuration['from_email']) && !filter_var($configuration['from_email'], FILTER_VALIDATE_EMAIL)) {
      $errors['from_email'] = $this->t('Invalid from email address.');
    }

    if (!empty($configuration['reply_to']) && !filter_var($configuration['reply_to'], FILTER_VALIDATE_EMAIL)) {
      $errors['reply_to'] = $this->t('Invalid reply-to email address.');
    }

    return $errors;
  }

  /**
   * Gets the recipient email address for a status change.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $options
   *   Additional options.
   *
   * @return string|null
   *   The recipient email address or NULL if not found.
   */
  protected function getRecipientEmail(StatusChangeInterface $status_change, array $options = []) {
    // Check if email is provided in options.
    if (!empty($options['email'])) {
      return $options['email'];
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

}
