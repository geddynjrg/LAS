<?php

namespace Drupal\status_manager_notifications\Form;

use Drupal\Core\Url;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\status_manager_notifications\Service\TemplateManager;
use Drupal\status_manager_notifications\Service\TokenReplacementService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for managing SMS notification templates.
 */
class SmsTemplatesForm extends FormBase {

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
   * Constructs an SmsTemplatesForm object.
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
    return 'status_manager_notifications_sms_templates_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $form['#attached']['library'][] = 'status_manager/admin';

    // Get all existing templates.
    $templates = $this->templateManager->getTemplates('sms');

    // Template list.
    $form['templates'] = [
      '#type' => 'details',
      '#title' => $this->t('Existing Templates'),
      '#open' => TRUE,
    ];

    if (!empty($templates)) {
      $header = [
        'id' => $this->t('Template ID'),
        'message' => $this->t('Message Preview'),
        'operations' => $this->t('Operations'),
      ];

      $rows = [];
      foreach ($templates as $id => $template) {
        $message_preview = $template['message'] ?? '';
        if (mb_strlen($message_preview) > 80) {
          $message_preview = mb_substr($message_preview, 0, 77) . '...';
        }

        $rows[] = [
          'id' => $id,
          'message' => $message_preview,
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
        '#markup' => '<p>' . $this->t('No SMS templates have been created yet.') . '</p>',
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
      $template = $this->templateManager->loadTemplate('sms', $template_id);
    }

    $form['template_form']['template_id'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Template ID'),
      '#description' => $this->t('Unique identifier for this template (e.g., "application.approved", "node.published").'),
      '#required' => TRUE,
      '#default_value' => $template ? $template_id : '',
      '#disabled' => (bool) $template,
    ];

    $form['template_form']['message'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Message'),
      '#description' => $this->t('SMS message content. You can use tokens. Character count: <span id="sms-char-count">0</span> / 160'),
      '#required' => TRUE,
      '#default_value' => $template['message'] ?? '',
      '#rows' => 5,
      '#maxlength' => 1600,
      '#attributes' => [
        'id' => 'sms-message-field',
      ],
    ];

    // Add character counter JavaScript.
    $form['#attached']['library'][] = 'core/drupal.ajax';
    $form['#attached']['drupalSettings']['smsCharCounter'] = TRUE;
    $form['#attached']['library'][] = 'status_manager_notifications/sms_char_counter';

    // Character count info.
    $form['template_form']['char_info'] = [
      '#type' => 'item',
      '#markup' => '<div class="sms-info"><p>' . $this->t('Standard SMS: 160 characters') . '</p><p>' . $this->t('Multi-part SMS: 153 characters per segment') . '</p><p id="sms-segment-info" class="messages messages--warning" style="display:none;">' . $this->t('This message will be sent as <span id="segment-count">1</span> SMS segment(s).') . '</p></div>',
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

    // Add inline JavaScript for character counting.
    $form['#attached']['library'][] = 'core/jquery';
    $form['#attached']['library'][] = 'core/drupal';
    $form['#attached']['library'][] = 'core/drupalSettings';

    // Add inline script for character counting.
    $js = "
      (function ($, Drupal) {
        Drupal.behaviors.smsCharCounter = {
          attach: function (context, settings) {
            $('#sms-message-field', context).once('sms-char-counter').on('input', function() {
              var length = $(this).val().length;
              $('#sms-char-count').text(length);
              
              if (length > 160) {
                var segments = Math.ceil(length / 153);
                $('#segment-count').text(segments);
                $('#sms-segment-info').show();
              } else {
                $('#sms-segment-info').hide();
              }
            }).trigger('input');
          }
        };
      })(jQuery, Drupal);
    ";

    $form['#attached']['html_head'][] = [
      [
        '#type' => 'html_tag',
        '#tag' => 'script',
        '#value' => $js,
      ],
      'sms_char_counter_script',
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $template_id = $form_state->getValue('template_id');
    $message = $form_state->getValue('message');

    // Validate template ID format.
    if (!preg_match('/^[a-z0-9_\.]+$/', $template_id)) {
      $form_state->setErrorByName('template_id', $this->t('Template ID must contain only lowercase letters, numbers, underscores, and dots.'));
    }

    // Validate template content.
    $errors = $this->templateManager->validateTemplate('sms', [
      'message' => $message,
    ]);

    foreach ($errors as $field => $error) {
      $form_state->setErrorByName($field, $error);
    }

    // Warn about message length.
    $length = mb_strlen($message);
    if ($length > 160 && $length <= 306) {
      $this->messenger()->addWarning($this->t('This message will be sent as 2 SMS segments.'));
    }
    elseif ($length > 306) {
      $segments = ceil($length / 153);
      $this->messenger()->addWarning($this->t('This message will be sent as @count SMS segments.', ['@count' => $segments]));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $template_id = $form_state->getValue('template_id');
    $template_data = [
      'message' => $form_state->getValue('message'),
    ];

    $this->templateManager->saveTemplate('sms', $template_id, $template_data);

    $this->messenger()->addStatus($this->t('SMS template "@id" has been saved.', ['@id' => $template_id]));

    // Clear the query parameters.
    $form_state->setRedirect('<current>');
  }

  /**
   * Delete template submit handler.
   */
  public function deleteTemplate(array &$form, FormStateInterface $form_state) {
    $template_id = $form_state->getValue('template_id');

    $this->templateManager->deleteTemplate('sms', $template_id);

    $this->messenger()->addStatus($this->t('SMS template "@id" has been deleted.', ['@id' => $template_id]));

    // Clear the query parameters.
    $form_state->setRedirect('<current>');
  }

}
