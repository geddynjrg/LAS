<?php

namespace Drupal\status_manager_notifications\Form;

use Drupal\Core\Url;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\status_manager_notifications\Service\TemplateManager;
use Drupal\status_manager_notifications\Service\TokenReplacementService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for managing email notification templates.
 */
class EmailTemplatesForm extends FormBase {

  /**
   * The template manager service.
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
   * Constructs an EmailTemplatesForm object.
   *
   * @param \Drupal\status_manager_notifications\Service\TemplateManager $template_manager
   *   The template manager service.
   * @param \Drupal\status_manager_notifications\Service\TokenReplacementService $token_service
   *   The token replacement service.
   */
  public function __construct(TemplateManager $template_manager, TokenReplacementService $token_service) {
    $this->templateManager = $template_manager;
    $this->tokenService = $token_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('status_manager_notifications.template_manager'),
      $container->get('status_manager_notifications.token_service')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'status_manager_notifications_email_templates_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['#attached']['library'][] = 'status_manager/admin';

    // Get all existing templates.
    $templates = $this->templateManager->getTemplates('email');

    // Template list.
    $form['templates'] = [
      '#type' => 'details',
      '#title' => $this->t('Existing Templates'),
      '#open' => TRUE,
    ];

    if (!empty($templates)) {
      $header = [
        'id' => $this->t('Template ID'),
        'subject' => $this->t('Subject'),
        'operations' => $this->t('Operations'),
      ];

      $rows = [];
      foreach ($templates as $id => $template) {
        $rows[] = [
          'id' => $id,
          'subject' => $template['subject'] ?? '',
          'operations' => [
            'data' => [
              '#type' => 'operations',
              '#links' => [
                'edit' => [
                  'title' => $this->t('Edit'),
                  'url' => Url::fromRoute('<current>', [], [
                    'query' => ['template_id' => $id, 'op' => 'edit'],
                  ]),
                ],
                'delete' => [
                  'title' => $this->t('Delete'),
                  'url' => Url::fromRoute('<current>', [], [
                    'query' => ['template_id' => $id, 'op' => 'delete'],
                  ]),
                ],
              ],
            ],
          ],
        ];
      }

      $form['templates']['table'] = [
        '#type' => 'table',
        '#header' => $header,
        '#rows' => $rows,
        '#empty' => $this->t('No templates found.'),
      ];
    }
    else {
      $form['templates']['empty'] = [
        '#markup' => '<p>' . $this->t('No email templates have been created yet.') . '</p>',
      ];
    }

    // Template form.
    $form['template_form'] = [
      '#type' => 'details',
      '#title' => $this->t('Add/Edit Template'),
      '#open' => TRUE,
    ];

    // Check if we're editing or deleting a template.
    $template_id = $this->getRequest()->query->get('template_id');
    $operation = $this->getRequest()->query->get('op');

    if ($template_id && $operation === 'delete') {
      // Delete confirmation.
      $form['template_form']['confirm'] = [
        '#markup' => '<p>' . $this->t('Are you sure you want to delete the template "@id"?', ['@id' => $template_id]) . '</p>',
      ];

      $form['template_form']['template_id'] = [
        '#type' => 'hidden',
        '#value' => $template_id,
      ];

      $form['template_form']['actions'] = [
        '#type' => 'actions',
      ];

      $form['template_form']['actions']['delete'] = [
        '#type' => 'submit',
        '#value' => $this->t('Delete'),
        '#submit' => ['::deleteTemplate'],
        '#button_type' => 'danger',
      ];

      $form['template_form']['actions']['cancel'] = [
        '#type' => 'link',
        '#title' => $this->t('Cancel'),
        '#url' => Url::fromRoute('<current>'),
        '#attributes' => ['class' => ['button']],
      ];

      return $form;
    }

    // Load template if editing.
    $template = NULL;
    if ($template_id && $operation === 'edit') {
      $template = $this->templateManager->loadTemplate('email', $template_id);
    }

    $form['template_form']['template_id'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Template ID'),
      '#description' => $this->t('Unique identifier for this template (e.g., "application.approved", "node.published").'),
      '#required' => TRUE,
      '#default_value' => $template ? $template_id : '',
      '#disabled' => (bool) $template,
    ];

    $form['template_form']['subject'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Subject'),
      '#description' => $this->t('Email subject line. You can use tokens.'),
      '#required' => TRUE,
      '#default_value' => $template['subject'] ?? '',
      '#maxlength' => 255,
    ];

    $form['template_form']['body'] = [
      '#type' => 'text_format',
      '#title' => $this->t('Body'),
      '#description' => $this->t('Email body content. You can use the rich text editor to format your content and insert tokens. The editor supports HTML formatting, links, lists, and more.'),
      '#required' => TRUE,
      '#default_value' => $template['body'] ?? $this->t('<p>Dear User,</p>

<p>We would like to inform you that there has been a <strong>status update</strong>.</p>

<p><strong>Details:</strong><br />
- Reference: [target_entity:label]<br />
- Previous Status: [status_change:old-status:human]<br />
- New Status: <em>[status_change:new-status:human]</em><br />
- Date: [status_change:created]</p>

<p>If you have any questions, please contact us.</p>

<p>Best regards,<br />
[site:name]</p>'),
      '#format' => $template['format'] ?? 'full_html',
      '#rows' => 15,
    ];

    // Token help.
    $form['template_form']['token_help'] = [
      '#type' => 'details',
      '#title' => $this->t('Available Tokens'),
      '#description' => $this->t('<strong>How to use tokens:</strong> You can copy and paste these tokens directly into the rich text editor above. Tokens will be replaced with actual values when the email is sent. For example, <code>[target_entity:label]</code> will be replaced with the actual name/title of the item.'),
      '#open' => FALSE,
    ];

    $tokens = $this->tokenService->getAvailableTokens();
    foreach ($tokens as $category => $info) {
      $form['template_form']['token_help'][$category] = [
        '#type' => 'details',
        '#title' => $info['label'],
        '#open' => FALSE,
      ];

      $token_list = [];
      foreach ($info['tokens'] as $token => $description) {
        $token_list[] = '<code>' . $token . '</code> - ' . $description;
      }

      $form['template_form']['token_help'][$category]['tokens'] = [
        '#markup' => '<ul><li>' . implode('</li><li>', $token_list) . '</li></ul>',
      ];
    }

    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $template ? $this->t('Update Template') : $this->t('Create Template'),
      '#button_type' => 'primary',
    ];

    if ($template) {
      $form['actions']['cancel'] = [
        '#type' => 'link',
        '#title' => $this->t('Cancel'),
        '#url' => Url::fromRoute('<current>'),
        '#attributes' => ['class' => ['button']],
      ];
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $template_id = $form_state->getValue('template_id');
    $subject = $form_state->getValue('subject');
    $body_field = $form_state->getValue('body');
    $body = is_array($body_field) ? $body_field['value'] : $body_field;

    // Validate template ID format.
    if (!preg_match('/^[a-z0-9_\.]+$/', $template_id)) {
      $form_state->setErrorByName('template_id', $this->t('Template ID must contain only lowercase letters, numbers, underscores, and dots.'));
    }

    // Validate template content.
    $errors = $this->templateManager->validateTemplate('email', [
      'subject' => $subject,
      'body' => $body,
    ]);

    foreach ($errors as $field => $error) {
      $form_state->setErrorByName($field, $error);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $template_id = $form_state->getValue('template_id');
    $body_field = $form_state->getValue('body');

    $template_data = [
      'subject' => $form_state->getValue('subject'),
      'body' => is_array($body_field) ? $body_field['value'] : $body_field,
      'format' => is_array($body_field) ? $body_field['format'] : $form_state->getValue('format'),
    ];

    $this->templateManager->saveTemplate('email', $template_id, $template_data);

    $this->messenger()->addStatus($this->t('Email template "@id" has been saved.', ['@id' => $template_id]));

    // Clear the query parameters.
    $form_state->setRedirect('<current>');
  }

  /**
   * Delete template submit handler.
   */
  public function deleteTemplate(array &$form, FormStateInterface $form_state) {
    $template_id = $form_state->getValue('template_id');

    $this->templateManager->deleteTemplate('email', $template_id);

    $this->messenger()->addStatus($this->t('Email template "@id" has been deleted.', ['@id' => $template_id]));

    // Clear the query parameters.
    $form_state->setRedirect('<current>');
  }

}
