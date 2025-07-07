<?php

namespace Drupal\status_manager\Service;

use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;

/**
 * Service for tracking status changes on any entity type.
 */
class StatusTracker {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The current user.
   *
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $currentUser;

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
   * The module handler.
   *
   * @var \Drupal\Core\Extension\ModuleHandlerInterface
   */
  protected $moduleHandler;

  /**
   * The notification manager.
   *
   * @var \Drupal\status_manager_notifications\Service\NotificationManager|null
   */
  protected $notificationManager;

  /**
   * Constructs a new StatusTracker.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Session\AccountProxyInterface $current_user
   *   The current user.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $module_handler
   *   The module handler.
   * @param \Drupal\status_manager_notifications\Service\NotificationManager|null $notification_manager
   *   The notification manager (optional).
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    AccountProxyInterface $current_user,
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
    ModuleHandlerInterface $module_handler,
    $notification_manager = NULL,
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->currentUser = $current_user;
    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get('status_manager');
    $this->moduleHandler = $module_handler;
    $this->notificationManager = $notification_manager;
  }

  /**
   * Logs a status change for any entity.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The target entity.
   * @param string $status_field
   *   The field name that contains the status.
   * @param string $old_status
   *   The old status value.
   * @param string $new_status
   *   The new status value.
   * @param string $source
   *   The source of the status change (user, system, api, etc.).
   * @param string $notification_type
   *   The notification type ('none', 'email', 'sms', 'both').
   * @param string $notes
   *   Optional notes about the status change.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface|null
   *   The created status change entity, or NULL if creation failed.
   */
  public function logStatusChange(
    EntityInterface $entity,
    $status_field,
    $old_status,
    $new_status,
    $source = 'user',
    $notification_type = 'none',
    $notes = '',
  ) {
    try {
      $status_change_storage = $this->entityTypeManager->getStorage('status_change');
      $status_change = $status_change_storage->create([
        'target_entity_type' => $entity->getEntityTypeId(),
        'target_entity_id' => $entity->id(),
        'status_field' => $status_field,
        'old_status' => $old_status,
        'new_status' => $new_status,
        'source' => $source,
        'notification_type' => $notification_type,
        'notification_status' => $notification_type === 'none' ? 'none' : 'pending',
        'notes' => $notes,
        'uid' => $this->currentUser->id(),
      ]);
      $status_change->save();

      $this->logger->info('Status change logged for @entity_type @entity_id: @field @old_status -> @new_status', [
        '@entity_type' => $entity->getEntityTypeId(),
        '@entity_id' => $entity->id(),
        '@field' => $status_field,
        '@old_status' => $old_status ?: '(none)',
        '@new_status' => $new_status,
      ]);

      // Trigger notifications if requested and notification service is
      // available.
      if ($notification_type !== 'none') {
        $this->triggerNotifications($status_change);
      }

      return $status_change;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to log status change for @entity_type @entity_id: @error', [
        '@entity_type' => $entity->getEntityTypeId(),
        '@entity_id' => $entity->id(),
        '@error' => $e->getMessage(),
      ]);
      return NULL;
    }
  }

  /**
   * Gets the status change history for an entity.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The target entity.
   * @param string|null $status_field
   *   Optional status field to filter by.
   * @param int $limit
   *   The maximum number of records to return.
   * @param int $offset
   *   The offset for pagination.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface[]
   *   An array of status change entities.
   */
  public function getStatusChangeHistory(EntityInterface $entity, $status_field = NULL, $limit = 10, $offset = 0) {
    try {
      $status_change_storage = $this->entityTypeManager->getStorage('status_change');
      $query = $status_change_storage->getQuery()
        ->condition('target_entity_type', $entity->getEntityTypeId())
        ->condition('target_entity_id', $entity->id())
        ->sort('created', 'DESC')
        ->accessCheck(FALSE)
        ->range($offset, $limit);

      if ($status_field) {
        $query->condition('status_field', $status_field);
      }

      $ids = $query->execute();
      return $status_change_storage->loadMultiple($ids);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to get status change history for @entity_type @entity_id: @error', [
        '@entity_type' => $entity->getEntityTypeId(),
        '@entity_id' => $entity->id(),
        '@error' => $e->getMessage(),
      ]);
      return [];
    }
  }

  /**
   * Gets the count of status changes for an entity.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The target entity.
   * @param string|null $status_field
   *   Optional status field to filter by.
   *
   * @return int
   *   The count of status changes.
   */
  public function getStatusChangeCount(EntityInterface $entity, $status_field = NULL) {
    try {
      $status_change_storage = $this->entityTypeManager->getStorage('status_change');
      $query = $status_change_storage->getQuery()
        ->condition('target_entity_type', $entity->getEntityTypeId())
        ->condition('target_entity_id', $entity->id())
        ->accessCheck(FALSE)
        ->count();

      if ($status_field) {
        $query->condition('status_field', $status_field);
      }

      return $query->execute();
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to get status change count for @entity_type @entity_id: @error', [
        '@entity_type' => $entity->getEntityTypeId(),
        '@entity_id' => $entity->id(),
        '@error' => $e->getMessage(),
      ]);
      return 0;
    }
  }

  /**
   * Gets all status changes for a specific entity type.
   *
   * @param string $entity_type
   *   The entity type ID.
   * @param int $limit
   *   The maximum number of records to return.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface[]
   *   An array of status change entities.
   */
  public function getStatusChangesByEntityType($entity_type, $limit = 50) {
    try {
      $status_change_storage = $this->entityTypeManager->getStorage('status_change');
      $query = $status_change_storage->getQuery()
        ->condition('target_entity_type', $entity_type)
        ->sort('created', 'DESC')
        ->accessCheck(FALSE)
        ->range(0, $limit);

      $ids = $query->execute();
      return $status_change_storage->loadMultiple($ids);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to get status changes for entity type @entity_type: @error', [
        '@entity_type' => $entity_type,
        '@error' => $e->getMessage(),
      ]);
      return [];
    }
  }

  /**
   * Automatically tracks status changes when an entity is updated.
   *
   * This method should be called from hook_entity_update().
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The updated entity.
   * @param \Drupal\Core\Entity\EntityInterface $original
   *   The original entity before update.
   * @param array $tracked_fields
   *   Array of field names to track for status changes.
   * @param string $source
   *   The source of the status change.
   * @param string $notification_type
   *   The notification type.
   */
  public function autoTrackStatusChanges(
    EntityInterface $entity,
    EntityInterface $original,
    array $tracked_fields,
    $source = 'user',
    $notification_type = 'none',
  ) {
    foreach ($tracked_fields as $field_name) {
      if ($entity->hasField($field_name) && $original->hasField($field_name)) {
        $new_value = $this->getFieldValue($entity, $field_name);
        $old_value = $this->getFieldValue($original, $field_name);

        if ($new_value !== $old_value) {
          $this->logStatusChange(
            $entity,
            $field_name,
            $old_value,
            $new_value,
            $source,
            $notification_type
          );
        }
      }
    }
  }

  /**
   * Gets a field value as a string for comparison.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The entity.
   * @param string $field_name
   *   The field name.
   *
   * @return string|null
   *   The field value as a string, or NULL if empty.
   */
  public function getFieldValue(EntityInterface $entity, $field_name) {
    if (!$entity->hasField($field_name)) {
      return NULL;
    }

    $field = $entity->get($field_name);
    if ($field->isEmpty()) {
      return NULL;
    }

    // Handle different field types.
    $field_definition = $field->getFieldDefinition();
    $field_type = $field_definition->getType();

    switch ($field_type) {
      case 'list_string':
      case 'string':
      case 'text':
        return $field->value;

      case 'entity_reference':
        $referenced_entity = $field->entity;
        return $referenced_entity ? $referenced_entity->label() : NULL;

      case 'boolean':
        return $field->value ? 'true' : 'false';

      default:
        return (string) $field->value;
    }
  }

  /**
   * Triggers notifications for a status change.
   *
   * This method integrates with the notification submodule if available.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   */
  protected function triggerNotifications($status_change) {
    // Check if the notification submodule is available and we have the manager.
    if ($this->moduleHandler->moduleExists('status_manager_notifications') && $this->notificationManager) {
      try {
        $this->notificationManager->sendNotifications($status_change);
      }
      catch (\Exception $e) {
        $this->logger->error('Failed to send notifications via notification manager: @error', [
          '@error' => $e->getMessage(),
        ]);
      }
    }
    else {
      // Fallback to hook system for custom implementations.
      $this->moduleHandler->invokeAll('status_manager_notification', [$status_change]);
    }
  }

}
