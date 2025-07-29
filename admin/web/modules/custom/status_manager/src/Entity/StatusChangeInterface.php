<?php

namespace Drupal\status_manager\Entity;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\EntityChangedInterface;
use Drupal\user\EntityOwnerInterface;

/**
 * Provides an interface for defining Status Change entities.
 *
 * @ingroup status_manager
 */
interface StatusChangeInterface extends ContentEntityInterface, EntityChangedInterface, EntityOwnerInterface {

  /**
   * Gets the target entity that this status change refers to.
   *
   * @return \Drupal\Core\Entity\EntityInterface|null
   *   The target entity, or NULL if not set.
   */
  public function getTargetEntity();

  /**
   * Sets the target entity that this status change refers to.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The target entity.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setTargetEntity($entity);

  /**
   * Gets the target entity type.
   *
   * @return string
   *   The target entity type ID.
   */
  public function getTargetEntityType();

  /**
   * Sets the target entity type.
   *
   * @param string $entity_type
   *   The target entity type ID.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setTargetEntityType($entity_type);

  /**
   * Gets the target entity ID.
   *
   * @return string|int
   *   The target entity ID.
   */
  public function getTargetEntityId();

  /**
   * Sets the target entity ID.
   *
   * @param string|int $entity_id
   *   The target entity ID.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setTargetEntityId($entity_id);

  /**
   * Gets the old status value.
   *
   * @return string|null
   *   The old status value.
   */
  public function getOldStatus();

  /**
   * Sets the old status value.
   *
   * @param string $status
   *   The old status value.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setOldStatus($status);

  /**
   * Gets the new status value.
   *
   * @return string
   *   The new status value.
   */
  public function getNewStatus();

  /**
   * Sets the new status value.
   *
   * @param string $status
   *   The new status value.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setNewStatus($status);

  /**
   * Gets the status field name that was changed.
   *
   * @return string
   *   The status field name.
   */
  public function getStatusField();

  /**
   * Sets the status field name that was changed.
   *
   * @param string $field_name
   *   The status field name.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setStatusField($field_name);

  /**
   * Gets the source of the status change.
   *
   * @return string
   *   The source (user, system, api, etc.).
   */
  public function getSource();

  /**
   * Sets the source of the status change.
   *
   * @param string $source
   *   The source.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setSource($source);

  /**
   * Gets the notification type.
   *
   * @return string
   *   The notification type.
   */
  public function getNotificationType();

  /**
   * Sets the notification type.
   *
   * @param string $type
   *   The notification type.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setNotificationType($type);

  /**
   * Gets the notification status.
   *
   * @return string
   *   The notification status.
   */
  public function getNotificationStatus();

  /**
   * Sets the notification status.
   *
   * @param string $status
   *   The notification status.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setNotificationStatus($status);

  /**
   * Gets the notification log.
   *
   * @return string|null
   *   The notification log.
   */
  public function getNotificationLog();

  /**
   * Sets the notification log.
   *
   * @param string $log
   *   The notification log.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setNotificationLog($log);

  /**
   * Gets the notes.
   *
   * @return string|null
   *   The notes.
   */
  public function getNotes();

  /**
   * Sets the notes.
   *
   * @param string $notes
   *   The notes.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setNotes($notes);

  /**
   * Gets the creation timestamp.
   *
   * @return int
   *   The creation timestamp.
   */
  public function getCreatedTime();

  /**
   * Sets the creation timestamp.
   *
   * @param int $timestamp
   *   The creation timestamp.
   *
   * @return \Drupal\status_manager\Entity\StatusChangeInterface
   *   The called Status Change entity.
   */
  public function setCreatedTime($timestamp);

}
