<?php

namespace Drupal\status_manager_notifications\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\status_manager\Entity\StatusChangeInterface;

/**
 * Service for managing notification templates.
 */
class TemplateManager {

  use StringTranslationTrait;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The logger service.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * Constructs a TemplateManager object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    EntityTypeManagerInterface $entity_type_manager,
    LoggerChannelFactoryInterface $logger_factory,
  ) {
    $this->configFactory = $config_factory;
    $this->entityTypeManager = $entity_type_manager;
    $this->logger = $logger_factory->get('status_manager_notifications');
  }

  /**
   * Gets a template for a specific notification type and status change.
   *
   * @param string $type
   *   The notification type ('email' or 'sms').
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param string|null $template_id
   *   Optional specific template ID to use.
   *
   * @return array|null
   *   The template array or NULL if not found.
   */
  public function getTemplate($type, StatusChangeInterface $status_change, $template_id = NULL) {
    // If a specific template ID is provided, try to load it.
    if ($template_id) {
      $template = $this->loadTemplate($type, $template_id);
      if ($template) {
        return $template;
      }
    }

    // Try to find a matching template based on entity type and status.
    $target_entity = $status_change->getTargetEntity();
    if (!$target_entity) {
      return $this->getDefaultTemplate($type);
    }

    $entity_type = $target_entity->getEntityTypeId();
    $bundle = $target_entity->bundle();
    $status_field = $status_change->getStatusField();
    $new_status = $status_change->getNewStatus();

    // Try to find the most specific template first.
    $template_keys = [
      // Most specific: entity_type.bundle.field.status.
      "{$entity_type}.{$bundle}.{$status_field}.{$new_status}",
      // Entity type, bundle, and field.
      "{$entity_type}.{$bundle}.{$status_field}",
      // Entity type and status.
      "{$entity_type}.{$new_status}",
      // Entity type and field.
      "{$entity_type}.{$status_field}",
      // Just entity type.
      $entity_type,
      // Just status.
      $new_status,
      // Default.
      'default',
    ];

    foreach ($template_keys as $key) {
      $template = $this->loadTemplate($type, $key);
      if ($template) {
        return $template;
      }
    }

    return $this->getDefaultTemplate($type);
  }

  /**
   * Loads a specific template by ID.
   *
   * @param string $type
   *   The notification type.
   * @param string $template_id
   *   The template ID.
   *
   * @return array|null
   *   The template array or NULL if not found.
   */
  public function loadTemplate($type, $template_id) {
    $config_name = "status_manager_notifications.{$type}_templates";
    $config = $this->configFactory->get($config_name);

    $template = $config->get($template_id);
    if ($template && is_array($template)) {
      // Ensure template has all required fields.
      $template['id'] = $template_id;
      $template['type'] = $type;
      return $template;
    }

    return NULL;
  }

  /**
   * Gets all templates for a specific type.
   *
   * @param string $type
   *   The notification type.
   *
   * @return array
   *   Array of templates keyed by template ID.
   */
  public function getTemplates($type) {
    $config_name = "status_manager_notifications.{$type}_templates";
    $config = $this->configFactory->get($config_name);

    $templates = [];
    $raw_data = $config->getRawData();

    foreach ($raw_data as $key => $template) {
      if (is_array($template) && !empty($template)) {
        $template['id'] = $key;
        $template['type'] = $type;
        $templates[$key] = $template;
      }
    }

    return $templates;
  }

  /**
   * Saves a template.
   *
   * @param string $type
   *   The notification type.
   * @param string $template_id
   *   The template ID.
   * @param array $template
   *   The template data.
   */
  public function saveTemplate($type, $template_id, array $template) {
    $config_name = "status_manager_notifications.{$type}_templates";
    $config = $this->configFactory->getEditable($config_name);

    // Remove metadata fields that shouldn't be saved.
    unset($template['id'], $template['type']);

    $config->set($template_id, $template);
    $config->save();

    $this->logger->info('Saved @type template: @id', [
      '@type' => $type,
      '@id' => $template_id,
    ]);
  }

  /**
   * Deletes a template.
   *
   * @param string $type
   *   The notification type.
   * @param string $template_id
   *   The template ID.
   */
  public function deleteTemplate($type, $template_id) {
    $config_name = "status_manager_notifications.{$type}_templates";
    $config = $this->configFactory->getEditable($config_name);

    $config->clear($template_id);
    $config->save();

    $this->logger->info('Deleted @type template: @id', [
      '@type' => $type,
      '@id' => $template_id,
    ]);
  }

  /**
   * Gets the default template for a notification type.
   *
   * @param string $type
   *   The notification type.
   *
   * @return array
   *   The default template.
   */
  protected function getDefaultTemplate($type) {
    if ($type === 'email') {
      return [
        'id' => 'default',
        'type' => 'email',
        'subject' => $this->t('Status Update: [status_change:entity-type] #[status_change:entity-id]'),
        'body' => $this->t("Hello,\n\nThe status of [status_change:entity-type] #[status_change:entity-id] has been updated.\n\nPrevious Status: [status_change:old-status]\nNew Status: [status_change:new-status]\n\nChanged by: [status_change:user]\nDate: [status_change:created]\n\nNotes: [status_change:notes]\n\nThank you."),
        'format' => 'plain_text',
      ];
    }
    elseif ($type === 'sms') {
      return [
        'id' => 'default',
        'type' => 'sms',
        'message' => $this->t('[status_change:entity-type] #[status_change:entity-id] status changed to [status_change:new-status]'),
      ];
    }

    return [];
  }

  /**
   * Validates a template.
   *
   * @param string $type
   *   The notification type.
   * @param array $template
   *   The template data.
   *
   * @return array
   *   Array of validation errors, empty if valid.
   */
  public function validateTemplate($type, array $template) {
    $errors = [];

    if ($type === 'email') {
      if (empty($template['subject'])) {
        $errors['subject'] = $this->t('Email subject is required.');
      }
      if (empty($template['body'])) {
        $errors['body'] = $this->t('Email body is required.');
      }
    }
    elseif ($type === 'sms') {
      if (empty($template['message'])) {
        $errors['message'] = $this->t('SMS message is required.');
      }
      if (strlen($template['message']) > 1600) {
        $errors['message'] = $this->t('SMS message is too long (maximum 1600 characters).');
      }
    }

    return $errors;
  }

  /**
   * Gets available tokens for templates.
   *
   * @return array
   *   Array of available tokens grouped by category.
   */
  public function getAvailableTokens() {
    return [
      'status_change' => [
        'label' => $this->t('Status Change'),
        'tokens' => [
          '[status_change:id]' => $this->t('Status change ID'),
          '[status_change:entity-type]' => $this->t('Target entity type'),
          '[status_change:entity-id]' => $this->t('Target entity ID'),
          '[status_change:entity-label]' => $this->t('Target entity label'),
          '[status_change:field]' => $this->t('Status field name'),
          '[status_change:old-status]' => $this->t('Previous status'),
          '[status_change:new-status]' => $this->t('New status'),
          '[status_change:source]' => $this->t('Change source'),
          '[status_change:notes]' => $this->t('Change notes'),
          '[status_change:created]' => $this->t('Change date'),
          '[status_change:user]' => $this->t('User who made the change'),
        ],
      ],
      'target_entity' => [
        'label' => $this->t('Target Entity'),
        'tokens' => [
          '[target_entity:*]' => $this->t('Any field from the target entity'),
        ],
      ],
      'user' => [
        'label' => $this->t('User'),
        'tokens' => [
          '[user:display-name]' => $this->t('User display name'),
          '[user:mail]' => $this->t('User email'),
          '[user:uid]' => $this->t('User ID'),
        ],
      ],
      'site' => [
        'label' => $this->t('Site'),
        'tokens' => [
          '[site:name]' => $this->t('Site name'),
          '[site:url]' => $this->t('Site URL'),
          '[site:mail]' => $this->t('Site email'),
        ],
      ],
    ];
  }

}
