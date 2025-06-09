<?php

namespace Drupal\status_manager\Entity;

use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\EntityChangedTrait;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Field\BaseFieldDefinition;
use Drupal\user\EntityOwnerTrait;
use Drupal\user\EntityOwnerInterface;

/**
 * Defines the Status Change entity.
 *
 * @ingroup status_manager
 *
 * @ContentEntityType(
 *   id = "status_change",
 *   label = @Translation("Status Change"),
 *   label_collection = @Translation("Status Changes"),
 *   handlers = {
 *     "view_builder" = "Drupal\Core\Entity\EntityViewBuilder",
 *     "list_builder" = "Drupal\status_manager\StatusChangeListBuilder",
 *     "views_data" = "Drupal\views\EntityViewsData",
 *     "access" = "Drupal\status_manager\StatusChangeAccessControlHandler",
 *     "form" = {
 *       "default" = "Drupal\status_manager\Form\StatusChangeForm",
 *       "add" = "Drupal\status_manager\Form\StatusChangeForm",
 *       "edit" = "Drupal\status_manager\Form\StatusChangeForm",
 *       "delete" = "Drupal\Core\Entity\ContentEntityDeleteForm"
 *     },
 *     "route_provider" = {
 *       "html" = "Drupal\Core\Entity\Routing\AdminHtmlRouteProvider",
 *     },
 *   },
 *   base_table = "status_changes",
 *   admin_permission = "administer status changes",
 *   entity_keys = {
 *     "id" = "id",
 *     "uuid" = "uuid",
 *     "uid" = "uid",
 *     "owner" = "uid",
 *   },
 *   links = {
 *     "canonical" = "/admin/content/status-changes/{status_change}",
 *     "add-form" = "/admin/content/status-changes/add",
 *     "edit-form" = "/admin/content/status-changes/{status_change}/edit",
 *     "delete-form" = "/admin/content/status-changes/{status_change}/delete",
 *     "collection" = "/admin/content/status-changes",
 *   },
 * )
 */
class StatusChange extends ContentEntityBase implements StatusChangeInterface, EntityOwnerInterface {

  use EntityChangedTrait;
  use EntityOwnerTrait;

  /**
   * {@inheritdoc}
   */
  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $fields = parent::baseFieldDefinitions($entity_type);
    $fields += static::ownerBaseFieldDefinitions($entity_type);

    $fields['target_entity_type'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Target Entity Type'))
      ->setDescription(t('The entity type of the target entity.'))
      ->setRequired(TRUE)
      ->setSettings([
        'max_length' => 255,
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'string',
        'weight' => 0,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 0,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['target_entity_id'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Target Entity ID'))
      ->setDescription(t('The ID of the target entity.'))
      ->setRequired(TRUE)
      ->setSettings([
        'max_length' => 255,
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'string',
        'weight' => 1,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 1,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['status_field'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Status Field'))
      ->setDescription(t('The field name that contains the status.'))
      ->setRequired(TRUE)
      ->setSettings([
        'max_length' => 255,
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'string',
        'weight' => 2,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 2,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['old_status'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Old Status'))
      ->setDescription(t('The previous status value.'))
      ->setSettings([
        'max_length' => 255,
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'string',
        'weight' => 10,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 10,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['new_status'] = BaseFieldDefinition::create('string')
      ->setLabel(t('New Status'))
      ->setDescription(t('The new status value.'))
      ->setRequired(TRUE)
      ->setSettings([
        'max_length' => 255,
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'string',
        'weight' => 20,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 20,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['source'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Source'))
      ->setDescription(t('The source of the status change (user, system, api, etc.).'))
      ->setRequired(TRUE)
      ->setDefaultValue('user')
      ->setSettings([
        'max_length' => 255,
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'string',
        'weight' => 30,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 30,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['notification_type'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Notification Type'))
      ->setDescription(t('The type of notification to send for this status change.'))
      ->setRequired(TRUE)
      ->setDefaultValue('none')
      ->setSetting('allowed_values', [
        'none' => t('None'),
        'email' => t('Email'),
        'sms' => t('SMS'),
        'both' => t('Email and SMS'),
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'list_default',
        'weight' => 40,
      ])
      ->setDisplayOptions('form', [
        'type' => 'options_select',
        'weight' => 40,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['notification_status'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Notification Status'))
      ->setDescription(t('The status of the notification.'))
      ->setRequired(TRUE)
      ->setDefaultValue('pending')
      ->setSetting('allowed_values', [
        'none' => t('None'),
        'pending' => t('Pending'),
        'sent' => t('Sent'),
        'failed' => t('Failed'),
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'list_default',
        'weight' => 50,
      ])
      ->setDisplayOptions('form', [
        'type' => 'options_select',
        'weight' => 50,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['notification_log'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Notification Log'))
      ->setDescription(t('Log of notification processing.'))
      ->setSettings([
        'max_length' => 2048,
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'string',
        'weight' => 60,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 60,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['notes'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Notes'))
      ->setDescription(t('Optional notes about the status change.'))
      ->setSettings([
        'max_length' => 2048,
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'string',
        'weight' => 70,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 70,
      ])
      ->setDisplayConfigurable('form', TRUE)
      ->setDisplayConfigurable('view', TRUE);

    $fields['created'] = BaseFieldDefinition::create('created')
      ->setLabel(t('Created'))
      ->setDescription(t('The time that the status change was created.'));

    $fields['changed'] = BaseFieldDefinition::create('changed')
      ->setLabel(t('Changed'))
      ->setDescription(t('The time that the status change was last edited.'));

    return $fields;
  }

  /**
   * {@inheritdoc}
   */
  public function getTargetEntity() {
    $entity_type = $this->getTargetEntityType();
    $entity_id = $this->getTargetEntityId();

    if ($entity_type && $entity_id) {
      try {
        $storage = \Drupal::entityTypeManager()->getStorage($entity_type);
        return $storage->load($entity_id);
      }
      catch (\Exception $e) {
        return NULL;
      }
    }

    return NULL;
  }

  /**
   * {@inheritdoc}
   */
  public function setTargetEntity($entity) {
    $this->setTargetEntityType($entity->getEntityTypeId());
    $this->setTargetEntityId($entity->id());
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getTargetEntityType() {
    return $this->get('target_entity_type')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setTargetEntityType($entity_type) {
    $this->set('target_entity_type', $entity_type);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getTargetEntityId() {
    return $this->get('target_entity_id')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setTargetEntityId($entity_id) {
    $this->set('target_entity_id', $entity_id);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getOldStatus() {
    return $this->get('old_status')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setOldStatus($status) {
    $this->set('old_status', $status);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getNewStatus() {
    return $this->get('new_status')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setNewStatus($status) {
    $this->set('new_status', $status);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getStatusField() {
    return $this->get('status_field')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setStatusField($field_name) {
    $this->set('status_field', $field_name);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getSource() {
    return $this->get('source')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setSource($source) {
    $this->set('source', $source);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getNotificationType() {
    return $this->get('notification_type')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setNotificationType($type) {
    $this->set('notification_type', $type);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getNotificationStatus() {
    return $this->get('notification_status')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setNotificationStatus($status) {
    $this->set('notification_status', $status);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getNotificationLog() {
    return $this->get('notification_log')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setNotificationLog($log) {
    $this->set('notification_log', $log);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getNotes() {
    return $this->get('notes')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setNotes($notes) {
    $this->set('notes', $notes);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getCreatedTime() {
    return $this->get('created')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setCreatedTime($timestamp) {
    $this->set('created', $timestamp);
    return $this;
  }

}
