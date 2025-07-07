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
      '#type' => 'textarea',
      '#title' => $this->t('Body'),
      '#description' => $this->t('Email body content. You can use tokens.'),
      '#required' => TRUE,
      '#default_value' => $template['body'] ?? '',
      '#rows' => 15,
    ];

    $form['template_form']['format'] = [
      '#type' => 'select',
      '#title' => $this->t('Format'),
      '#options' => [
        'plain_text' => $this->t('Plain Text'),
        'html' => $this->t('HTML'),
      ],
      '#default_value' => $template['format'] ?? 'plain_text',
    ];

    // Token help.
    $form['template_form']['token_help'] = [
      '#type' => 'details',
      '#title' => $this->t('Available Tokens'),
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
    $body = $form_state->getValue('body');

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
    $template_data = [
      'subject' => $form_state->getValue('subject'),
      'body' => $form_state->getValue('body'),
      'format' => $form_state->getValue('format'),
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
