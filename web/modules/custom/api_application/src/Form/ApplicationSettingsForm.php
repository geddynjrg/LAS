<?php

namespace Drupal\api_application\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configuration form for Application entities.
 */
class ApplicationSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_application_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['api_application.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_application.settings');

    $form['application_settings'] = [
      '#type' => 'details',
      '#title' => $this->t('Application Settings'),
      '#open' => TRUE,
    ];

    $form['application_settings']['min_group_members'] = [
      '#type' => 'number',
      '#title' => $this->t('Minimum group members'),
      '#description' => $this->t('The minimum number of members required in a group.'),
      '#default_value' => $config->get('min_group_members') ?? 10,
      '#min' => 1,
      '#required' => TRUE,
    ];

    $form['application_settings']['max_group_members'] = [
      '#type' => 'number',
      '#title' => $this->t('Maximum group members'),
      '#description' => $this->t('The maximum number of members allowed in a group.'),
      '#default_value' => $config->get('max_group_members') ?? 15,
      '#min' => 1,
      '#required' => TRUE,
    ];

    $form['application_settings']['application_prefix'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Application ID Prefix'),
      '#default_value' => $config->get('application_prefix') ?: 'APP-',
      '#description' => $this->t('Prefix for application IDs displayed in the listing. Default is APP-'),
      '#required' => TRUE,
    ];

    $form['file_settings'] = [
      '#type' => 'details',
      '#title' => $this->t('File Upload Settings'),
      '#open' => TRUE,
    ];

    $form['file_settings']['max_file_size'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Maximum file size'),
      '#description' => $this->t('Enter the maximum allowed file size for uploads (e.g., "5MB", "10MB").'),
      '#default_value' => $config->get('max_file_size') ?? '5MB',
      '#required' => TRUE,
    ];

    $form['file_settings']['allowed_extensions'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Allowed file extensions'),
      '#description' => $this->t('Enter allowed file extensions separated by spaces (e.g., "pdf jpg jpeg png").'),
      '#default_value' => $config->get('allowed_extensions') ?? 'pdf jpg jpeg png',
      '#required' => TRUE,
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $min = $form_state->getValue('min_group_members');
    $max = $form_state->getValue('max_group_members');

    if ($min > $max) {
      $form_state->setErrorByName('min_group_members', $this->t('Minimum group members cannot be greater than maximum group members.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('api_application.settings')
      ->set('min_group_members', $form_state->getValue('min_group_members'))
      ->set('max_group_members', $form_state->getValue('max_group_members'))
      ->set('max_file_size', $form_state->getValue('max_file_size'))
      ->set('allowed_extensions', $form_state->getValue('allowed_extensions'))
      ->set('application_prefix', $form_state->getValue('application_prefix'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}
