<?php

namespace Drupal\api_application\Form;

use Drupal\Core\Entity\ContentEntityForm;
use Drupal\Core\Form\FormStateInterface;

/**
 * Form controller for Application edit forms.
 *
 * @ingroup api_application
 */
class ApplicationForm extends ContentEntityForm {

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    /** @var \Drupal\api_application\Entity\Application $entity */
    $form = parent::buildForm($form, $form_state);

    // Add conditional visibility for rejection fields.
    if (isset($form['rejection_reason'])) {
      $form['rejection_reason']['#states'] = [
        'visible' => [
          ':input[name="status[0][value]"]' => ['value' => 'rejected'],
        ],
        'required' => [
          ':input[name="status[0][value]"]' => ['value' => 'rejected'],
        ],
      ];
    }

    if (isset($form['rejection_message'])) {
      $form['rejection_message']['#states'] = [
        'visible' => [
          ':input[name="status[0][value]"]' => ['value' => 'rejected'],
        ],
        'required' => [
          ':input[name="status[0][value]"]' => ['value' => 'rejected'],
        ],
      ];
    }

    // Add our library for JavaScript behaviors.
    $form['#attached']['library'][] = 'api_application/admin';

    // Add validation to ensure rejection fields are filled when status is
    // rejected.
    $form['#validate'][] = '::validateRejectionFields';

    return $form;
  }

  /**
   * Validates rejection fields when status is set to rejected.
   */
  public function validateRejectionFields(array &$form, FormStateInterface $form_state) {
    $status = $form_state->getValue(['status', 0, 'value']);

    if ($status === 'rejected') {
      $rejection_reason = $form_state->getValue(['rejection_reason', 0, 'value']);
      $rejection_message = $form_state->getValue(['rejection_message', 0, 'value']);

      if (empty($rejection_reason)) {
        $form_state->setErrorByName('rejection_reason', $this->t('Please select a rejection reason when rejecting an application.'));
      }

      if (empty($rejection_message) || strlen(trim($rejection_message)) < 20) {
        $form_state->setErrorByName('rejection_message', $this->t('Please provide a detailed rejection message (at least 20 characters) when rejecting an application.'));
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function save(array $form, FormStateInterface $form_state) {
    $entity = $this->entity;

    $status = parent::save($form, $form_state);

    switch ($status) {
      case SAVED_NEW:
        $this->messenger()->addMessage($this->t('Created the %label Application.', [
          '%label' => $entity->label(),
        ]));
        break;

      default:
        $this->messenger()->addMessage($this->t('Saved the %label Application.', [
          '%label' => $entity->label(),
        ]));
    }

    $form_state->setRedirect('entity.application.canonical', ['application' => $entity->id()]);
  }

}
