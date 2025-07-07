<?php

namespace Drupal\status_manager_notifications\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Drupal\status_manager_notifications\NotificationInterface;
use Drupal\status_manager_notifications\Plugin\NotificationProviderManager;

/**
 * Service for sending SMS notifications.
 */
class SmsNotificationService implements NotificationInterface {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The logger service.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * The notification provider plugin manager.
   *
   * @var \Drupal\status_manager_notifications\Plugin\NotificationProviderManager
   */
  protected $providerManager;

  /**
   * The template manager.
   *
   * @var \Drupal\status_manager_notifications\Service\TemplateManager
   */
  protected $templateManager;

  /**
   * The token replacement service.
   *
   * @var \Drupal\status_manager_notifications\Service\TokenReplacementService
   */
  protected $tokenService;

  /**
   * The active SMS provider instance.
   *
   * @var \Drupal\status_manager_notifications\Plugin\NotificationProviderInterface|null
   */
  protected $activeProvider;

  /**
   * Constructs an SmsNotificationService object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   * @param \Drupal\status_manager_notifications\Service\TemplateManager $template_manager
   *   The template manager service.
   * @param \Drupal\status_manager_notifications\Service\TokenReplacementService $token_service
   *   The token replacement service.
   * @param \Drupal\status_manager_notifications\Plugin\NotificationProviderManager $provider_manager
   *   The notification provider plugin manager.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
    TemplateManager $template_manager,
    TokenReplacementService $token_service,
    NotificationProviderManager $provider_manager,
  ) {
    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get('status_manager_notifications.sms');
    $this->templateManager = $template_manager;
    $this->tokenService = $token_service;
    $this->providerManager = $provider_manager;
  }

  /**
   * {@inheritdoc}
   */
  public function getNotificationType() {
    return 'sms';
  }

  /**
   * {@inheritdoc}
   */
  public function isEnabled() {
    $config = $this->configFactory->get('status_manager.settings');
    return (bool) $config->get('notifications.sms_enabled');
  }

  /**
   * {@inheritdoc}
   */
  public function sendNotification(StatusChangeInterface $status_change, array $options = []) {
    if (!$this->isEnabled()) {
      return [
        'success' => FALSE,
        'message' => 'SMS notifications are disabled.',
      ];
    }

    // Get the active provider.
    $provider = $this->getActiveProvider();
    if (!$provider) {
      return [
        'success' => FALSE,
        'message' => 'No active SMS provider configured.',
      ];
    }

    // Get the target entity.
    $entity = $status_change->getTargetEntity();
    if (!$entity) {
      return [
        'success' => FALSE,
        'message' => 'Target entity not found.',
      ];
    }

    // Get recipient phone number.
    $recipient = $this->getRecipientPhone($entity);
    if (!$recipient) {
      return [
        'success' => FALSE,
        'message' => 'No recipient phone number found.',
      ];
    }

    // Get the SMS template.
    $template = $this->templateManager->getTemplate('sms', $status_change);

    if (!$template) {
      // Use default template if no specific template found.
      $template = $this->getDefaultTemplate($status_change);
    }

    // Replace tokens in the template.
    $message = $this->tokenService->replace(
      $template['message'],
      [
        'status_change' => $status_change,
        $entity->getEntityTypeId() => $entity,
      ]
    );

    // Send the SMS using the provider.
    try {
      $result = $provider->sendCustomMessage($recipient, $message, array_merge([
        'entity' => $entity,
        'status_change' => $status_change,
      ], $options));

      return $result;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to send SMS: @error', ['@error' => $e->getMessage()]);
      return [
        'success' => FALSE,
        'message' => 'Failed to send SMS: ' . $e->getMessage(),
      ];
    }
  }

  /**
   * Gets the active SMS provider instance.
   *
   * @return \Drupal\status_manager_notifications\Plugin\NotificationProviderInterface|null
   *   The active provider or NULL if none configured.
   */
  protected function getActiveProvider() {
    if ($this->activeProvider === NULL) {
      $config = $this->configFactory->get('status_manager_notifications.settings');
      $active_provider_id = $config->get('sms.active_provider');

      if ($active_provider_id) {
        try {
          $this->activeProvider = $this->providerManager->createInstance($active_provider_id);
        }
        catch (\Exception $e) {
          $this->logger->error('Failed to create SMS provider @id: @error', [
            '@id' => $active_provider_id,
            '@error' => $e->getMessage(),
          ]);
        }
      }
    }

    return $this->activeProvider ?: FALSE;
  }

  /**
   * Gets the recipient phone number from an entity.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The entity to get the phone from.
   *
   * @return string|null
   *   The phone number or NULL if not found.
   */
  protected function getRecipientPhone($entity) {
    // Check common phone field names.
    $phone_fields = [
      'field_phone',
      'field_phone_number',
      'field_mobile',
      'field_mobile_number',
      'phone',
      'mobile',
    // For applications.
      'applicant_phone_number',
    ];

    foreach ($phone_fields as $field_name) {
      if ($entity->hasField($field_name) && !$entity->get($field_name)->isEmpty()) {
        return $entity->get($field_name)->value;
      }
    }

    // Check if entity has a method to get phone.
    if (method_exists($entity, 'getPhoneNumber')) {
      return $entity->getPhoneNumber();
    }

    return NULL;
  }

  /**
   * Gets the default SMS template for a status change.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   *
   * @return array
   *   The template array with 'message' key.
   */
  protected function getDefaultTemplate(StatusChangeInterface $status_change) {
    $entity = $status_change->getTargetEntity();
    $entity_label = $entity ? $entity->label() : 'Record';

    return [
      'message' => sprintf(
        '%s status changed from %s to %s.',
        $entity_label,
        $status_change->getOldStatus() ?: 'none',
        $status_change->getNewStatus()
      ),
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getConfiguration() {
    return $this->configFactory->get('status_manager_notifications.sms')->get() ?: [
      'enabled' => FALSE,
      'provider' => 'twilio',
      'api_key' => '',
      'api_secret' => '',
      'from_number' => '',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function validateConfiguration(array $configuration) {
    $errors = [];

    if (!empty($configuration['from_number']) && !preg_match('/^\+?[1-9]\d{1,14}$/', $configuration['from_number'])) {
      $errors['from_number'] = 'Invalid phone number format. Use international format (e.g., +1234567890).';
    }

    if (empty($configuration['api_key'])) {
      $errors['api_key'] = 'API key is required when SMS is enabled.';
    }

    return $errors;
  }

}
