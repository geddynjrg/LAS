<?php

namespace Drupal\api_application\Form;

use Drupal\Core\Entity\ContentEntityForm;
use Drupal\Core\Form\FormStateInterface;

/**
 * Form controller for Group Member edit forms.
 *
 * @ingroup api_application
 */
class GroupMemberForm extends ContentEntityForm {

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    /** @var \Drupal\api_application\Entity\GroupMember $entity */
    $form = parent::buildForm($form, $form_state);

    // Add states for PWD fields.
    $form['certificate_disability']['#states'] = [
      'visible' => [
        ':input[name="person_with_disability[value]"]' => ['checked' => TRUE],
      ],
      'required' => [
        ':input[name="person_with_disability[value]"]' => ['checked' => TRUE],
      ],
    ];

    $form['pwd_number']['#states'] = [
      'visible' => [
        ':input[name="person_with_disability[value]"]' => ['checked' => TRUE],
      ],
      'required' => [
        ':input[name="person_with_disability[value]"]' => ['checked' => TRUE],
      ],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function save(array $form, FormStateInterface $form_state) {
    $entity = $this->entity;

    $status = parent::save($form, $form_state);

    switch ($status) {
      case SAVED_NEW:
        $this->messenger()->addMessage($this->t('Created new group member %label.', [
          '%label' => $entity->label(),
        ]));
        break;

      default:
        $this->messenger()->addMessage($this->t('Saved group member %label.', [
          '%label' => $entity->label(),
        ]));
    }

    // If this is being created from an application form, don't redirect.
    if (!$form_state->getRedirect()) {
      $form_state->setRedirect('entity.group_member.canonical', ['group_member' => $entity->id()]);
    }
  }

}
