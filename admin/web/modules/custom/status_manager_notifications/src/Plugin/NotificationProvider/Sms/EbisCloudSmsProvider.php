<?php

namespace Drupal\status_manager_notifications\Plugin\NotificationProvider\Sms;

use Drupal\sms_providers\Service\SmsService;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Drupal\status_manager_notifications\Plugin\SmsProviderBase;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Sends status-change SMS via the shared sms_providers EBIS Cloud transport.
 *
 * @NotificationProvider(
 *   id = "ebis",
 *   label = @Translation("EBIS Cloud SMS (Uwezo Fund)"),
 *   description = @Translation("Send SMS notifications using the EBIS Cloud provider configured in SMS Providers."),
 *   type = "sms",
 *   weight = 0
 * )
 */
class EbisCloudSmsProvider extends SmsProviderBase {

  /**
   * The unified SMS service.
   *
   * @var \Drupal\sms_providers\Service\SmsService
   */
  protected SmsService $smsService;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    $instance = parent::create($container, $configuration, $plugin_id, $plugin_definition);
    $instance->smsService = $container->get('sms_providers.sms_service');
    return $instance;
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured() {
    return $this->smsService->isConfigured();
  }

  /**
   * {@inheritdoc}
   */
  protected function sendTemplatedMessage(StatusChangeInterface $status_change, array $options = []) {
    $recipient = $this->getRecipient($status_change, $options);
    if (!$recipient) {
      return [
        'success' => FALSE,
        'message' => $this->t('No recipient phone number found.'),
      ];
    }

    $template_service = \Drupal::service('status_manager_notifications.template_manager');
    $template = $template_service->getTemplate('sms', $status_change, $options['template_id'] ?? NULL);
    if (!$template) {
      return [
        'success' => FALSE,
        'message' => $this->t('No SMS template found for this status change.'),
      ];
    }

    $token_service = \Drupal::service('status_manager_notifications.token_service');
    $token_data = [
      'status_change' => $status_change,
      'target_entity' => $status_change->getTargetEntity(),
      'user' => $status_change->getOwner(),
    ];
    if (!empty($options['additional_data'])) {
      $token_data = array_merge($token_data, $options['additional_data']);
    }

    $message = $token_service->replace($template['message'], $token_data);
    $message = $this->truncateMessage($message);

    return $this->sendCustomMessage($recipient, $message, $options);
  }

  /**
   * {@inheritdoc}
   */
  public function sendCustomMessage($recipient, $message, array $options = []) {
    if (!$this->isConfigured()) {
      return [
        'success' => FALSE,
        'message' => $this->t('EBIS Cloud SMS is not configured. Set EBISCLOUD_SMS_* environment variables and select the ebis provider in SMS Providers.'),
      ];
    }

    if (empty($recipient)) {
      return [
        'success' => FALSE,
        'message' => $this->t('No recipient phone number provided.'),
      ];
    }

    try {
      $this->smsService->sendSms($recipient, $message);
      return [
        'success' => TRUE,
        'message' => $this->t('SMS sent successfully to @recipient', ['@recipient' => $recipient]),
      ];
    }
    catch (\Exception $e) {
      $this->log('error', 'EBIS status SMS failed: @error', ['@error' => $e->getMessage()]);
      return [
        'success' => FALSE,
        'message' => $this->t('Failed to send SMS: @error', ['@error' => $e->getMessage()]),
      ];
    }
  }

}
