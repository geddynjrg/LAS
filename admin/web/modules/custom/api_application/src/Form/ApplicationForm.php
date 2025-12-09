<?php

namespace Drupal\api_application\Form;

use Drupal\api_application\ApplicationStatusConstants;
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
          ':input[name="status[0][value]"]' => ['value' => ApplicationStatusConstants::REJECTED],
        ],
        'required' => [
          ':input[name="status[0][value]"]' => ['value' => ApplicationStatusConstants::REJECTED],
        ],
      ];
    }

    if (isset($form['rejection_message'])) {
      $form['rejection_message']['#states'] = [
        'visible' => [
          ':input[name="status[0][value]"]' => ['value' => ApplicationStatusConstants::REJECTED],
        ],
        'required' => [
          ':input[name="status[0][value]"]' => ['value' => ApplicationStatusConstants::REJECTED],
        ],
      ];
    }

    // Filter status options for constituency reviewers.
    if (isset($form['status'])) {
      $this->filterStatusOptionsForConstituencyReviewers($form);
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

    if ($status === ApplicationStatusConstants::REJECTED) {
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

  /**
   * Filter status field options for constituency reviewers.
   *
   * @param array $form
   *   The form array.
   */
  protected function filterStatusOptionsForConstituencyReviewers(array &$form): void {
    $account = $this->currentUser();
    $entity = $this->entity;

    // Skip if user has admin permission.
    if ($account->hasPermission('administer loan applications')) {
      return;
    }

    // Check if user is a constituency reviewer.
    $is_constituency_reviewer = FALSE;
    if ($entity->hasField('constituency') && !$entity->get('constituency')->isEmpty()) {
      $constituency = $entity->get('constituency')->entity;
      if ($constituency && $account->hasPermission("administer constituency applications:{$constituency->id()}")) {
        $is_constituency_reviewer = TRUE;
      }
    }

    if (!$is_constituency_reviewer) {
      return;
    }

    // Define allowed statuses for constituency reviewers.
    $allowed_statuses = [
      ApplicationStatusConstants::DRAFT,
      ApplicationStatusConstants::GROUP_MEMBER_CONFIRMATION,
      ApplicationStatusConstants::SUBMITTED,
      ApplicationStatusConstants::CONSTITUENCY_REVIEW,
      ApplicationStatusConstants::APPROVED_BY_CONSTITUENCY,
      ApplicationStatusConstants::REJECTED,
    ];

    // Filter the status field options.
    if (isset($form['status']['widget'][0]['value']['#options'])) {
      $all_options = $form['status']['widget'][0]['value']['#options'];
      $filtered_options = array_intersect_key(
        $all_options,
        array_flip($allowed_statuses)
      );
      $form['status']['widget'][0]['value']['#options'] = $filtered_options;
    }
  }

}
