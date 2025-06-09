<?php

namespace Drupal\status_manager\Form;

use Drupal\Core\Entity\ContentEntityForm;
use Drupal\Core\Form\FormStateInterface;

/**
 * Form controller for Status Change edit forms.
 *
 * @ingroup status_manager
 */
class StatusChangeForm extends ContentEntityForm {

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form = parent::buildForm($form, $form_state);

    /** @var \Drupal\status_manager\Entity\StatusChangeInterface $entity */
    $entity = $this->entity;

    // Add custom CSS/JS.
    $form['#attached']['library'][] = 'status_manager/admin';

    // Add form wrapper class.
    $form['#attributes']['class'][] = 'status-change-form';

    // Customize field descriptions.
    if (isset($form['target_entity_type'])) {
      $form['target_entity_type']['widget'][0]['value']['#description'] = $this->t('The machine name of the entity type (e.g., node, user, application).');
    }

    if (isset($form['target_entity_id'])) {
      $form['target_entity_id']['widget'][0]['value']['#description'] = $this->t('The numeric ID of the specific entity.');
    }

    if (isset($form['status_field'])) {
      $form['status_field']['widget'][0]['value']['#description'] = $this->t('The machine name of the field that contains the status (e.g., status, moderation_state).');
    }

    if (isset($form['source'])) {
      $form['source']['widget'][0]['value']['#description'] = $this->t('The source of this status change (user, system, api, etc.).');
    }

    // Set default values for new entities.
    if ($entity->isNew()) {
      // Set current user as owner.
      if (isset($form['uid'])) {
        $form['uid']['widget'][0]['target_id']['#default_value'] = $this->currentUser();
      }

      // Set default source.
      if (isset($form['source']) && empty($form['source']['widget'][0]['value']['#default_value'])) {
        $form['source']['widget'][0]['value']['#default_value'] = 'user';
      }

      // Set default notification status based on notification type.
      if (isset($form['notification_type']) && isset($form['notification_status'])) {
        $form['notification_status']['#states'] = [
          'value' => [
            ':input[name="notification_type"]' => ['value' => 'none'],
          ],
        ];
      }
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);

    /** @var \Drupal\status_manager\Entity\StatusChangeInterface $entity */
    $entity = $this->buildEntity($form, $form_state);

    // Validate that the target entity exists.
    $target_entity_type = $entity->getTargetEntityType();
    $target_entity_id = $entity->getTargetEntityId();

    if ($target_entity_type && $target_entity_id) {
      try {
        $storage = $this->entityTypeManager->getStorage($target_entity_type);
        $target_entity = $storage->load($target_entity_id);

        if (!$target_entity) {
          $form_state->setErrorByName('target_entity_id', $this->t('The specified entity does not exist.'));
        }
        else {
          // Validate that the status field exists on the target entity.
          $status_field = $entity->getStatusField();
          if ($status_field && !$target_entity->hasField($status_field)) {
            $form_state->setErrorByName('status_field', $this->t('The specified field does not exist on the target entity.'));
          }
        }
      }
      catch (\Exception $e) {
        $form_state->setErrorByName('target_entity_type', $this->t('Invalid entity type specified.'));
      }
    }

    // Validate that new status is provided.
    if (empty($entity->getNewStatus())) {
      $form_state->setErrorByName('new_status', $this->t('New status is required.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function save(array $form, FormStateInterface $form_state) {
    /** @var \Drupal\status_manager\Entity\StatusChangeInterface $entity */
    $entity = $this->entity;

    // Set notification status based on notification type if not already set.
    if ($entity->getNotificationType() === 'none' && $entity->getNotificationStatus() !== 'none') {
      $entity->setNotificationStatus('none');
    }
    elseif ($entity->getNotificationType() !== 'none' && $entity->getNotificationStatus() === 'none') {
      $entity->setNotificationStatus('pending');
    }

    $status = parent::save($form, $form_state);

    switch ($status) {
      case SAVED_NEW:
        $this->messenger()->addMessage($this->t('Created the %label Status Change.', [
          '%label' => $entity->label(),
        ]));
        break;

      default:
        $this->messenger()->addMessage($this->t('Saved the %label Status Change.', [
          '%label' => $entity->label(),
        ]));
    }

    $form_state->setRedirect('entity.status_change.canonical', ['status_change' => $entity->id()]);

    return $status;
  }

}
