<?php

namespace Drupal\api_application\Form;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\api_application\Service\ConfigFileService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configuration form for Application entities.
 */
class ApplicationSettingsForm extends ConfigFormBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The config file service.
   *
   * @var \Drupal\api_application\Service\ConfigFileService
   */
  protected $configFileService;

  /**
   * Constructs a new ApplicationSettingsForm.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\api_application\Service\ConfigFileService $config_file_service
   *   The config file service.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager, ConfigFileService $config_file_service) {
    $this->entityTypeManager = $entity_type_manager;
    $this->configFileService = $config_file_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('api_application.config_file_service')
    );
  }

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

    // Add vertical tabs.
    $form['#tree'] = TRUE;
    $form['#attached']['library'][] = 'api_application/admin';

    // Add class for proper form handling.
    $form['#attributes']['class'][] = 'api-application-settings';

    $form['tabs'] = [
      '#type' => 'vertical_tabs',
      '#default_tab' => 'general_settings',
    ];

    // General Settings Tab.
    $form['general_settings'] = [
      '#type' => 'details',
      '#title' => $this->t('General Settings'),
      '#group' => 'tabs',
      '#open' => TRUE,
    ];

    $form['general_settings']['application_settings'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Application Settings'),
    ];

    $form['general_settings']['application_settings']['min_group_members'] = [
      '#type' => 'number',
      '#title' => $this->t('Minimum group members'),
      '#description' => $this->t('The minimum number of members required in a group.'),
      '#default_value' => $config->get('min_group_members') ?? 10,
      '#min' => 1,
      '#required' => TRUE,
    ];

    $form['general_settings']['application_settings']['max_group_members'] = [
      '#type' => 'number',
      '#title' => $this->t('Maximum group members'),
      '#description' => $this->t('The maximum number of members allowed in a group.'),
      '#default_value' => $config->get('max_group_members') ?? 15,
      '#min' => 1,
      '#required' => TRUE,
    ];

    $form['general_settings']['application_settings']['application_prefix'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Application ID Prefix'),
      '#default_value' => $config->get('application_prefix') ?: 'APP-',
      '#description' => $this->t('Prefix for application IDs displayed in the listing. Default is APP-'),
      '#required' => TRUE,
    ];

    // API Settings.
    $form['general_settings']['api_settings'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('API Settings'),
    ];

    $form['general_settings']['api_settings']['api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('API Key'),
      '#default_value' => $config->get('api_key') ?: '',
      '#description' => $this->t('The API key for authenticating external API requests. This key should be included in the X-API-Key header.'),
      '#required' => TRUE,
      '#maxlength' => 255,
    ];

    $form['general_settings']['api_settings']['api_key_help'] = [
      '#type' => 'item',
      '#markup' => $this->t('<strong>Note:</strong> This API key is used for authenticating requests to the Application POST and GET endpoints. Keep this key secure and only share it with authorized systems.'),
    ];

    $form['general_settings']['file_settings'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('File Upload Settings'),
    ];

    $form['general_settings']['file_settings']['max_file_size'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Maximum file size'),
      '#description' => $this->t('Enter the maximum allowed file size for uploads (e.g., "5MB", "10MB").'),
      '#default_value' => $config->get('max_file_size') ?? '5MB',
      '#required' => TRUE,
    ];

    $form['general_settings']['file_settings']['allowed_extensions'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Allowed file extensions'),
      '#description' => $this->t('Enter allowed file extensions separated by spaces (e.g., "pdf jpg jpeg png webp").'),
      '#default_value' => $config->get('allowed_extensions') ?? 'pdf jpg jpeg png webp',
      '#required' => TRUE,
    ];

    // Instructions Tab.
    $form['instructions_tab'] = [
      '#type' => 'details',
      '#title' => $this->t('Instructions'),
      '#group' => 'tabs',
    ];

    // Include the instructions form elements.
    $this->buildInstructionsForm($form['instructions_tab'], $form_state);

    return parent::buildForm($form, $form_state);
  }

  /**
   * Build the instructions form elements.
   */
  protected function buildInstructionsForm(&$form, FormStateInterface $form_state) {
    $config = $this->config('api_application.settings');
    $instructions = $config->get('instructions') ?? [];

    $form['instructions'] = [
      '#type' => 'container',
    ];

    // Page Settings Section.
    $form['instructions']['page_settings'] = [
      '#type' => 'details',
      '#title' => $this->t('Instructions Page Settings'),
      '#open' => TRUE,
      '#attributes' => [
        'style' => 'margin-bottom: 2rem;',
      ],
    ];

    $form['instructions']['page_settings']['title'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Page Title'),
      '#description' => $this->t('Title that appears at the top of the instructions page.'),
      '#default_value' => $instructions['title'] ?? '',
      '#required' => TRUE,
      '#maxlength' => 255,
    ];

    $form['instructions']['page_settings']['body'] = [
      '#type' => 'text_format',
      '#title' => $this->t('Introduction Text'),
      '#description' => $this->t('Text that appears below the title. This field supports formatted text.'),
      '#default_value' => $instructions['body']['value'] ?? '',
      '#format' => $instructions['body']['format'] ?? 'basic_html',
      '#required' => FALSE,
    ];

    // Documents Configuration Section.
    $form['instructions']['documents_section'] = [
      '#type' => 'details',
      '#title' => $this->t('Required Documents Configuration'),
      '#description' => $this->t('Configure the documents that applicants need to provide. Each document type can have example images and additional information.'),
      '#open' => TRUE,
    ];

    $form['instructions']['documents_section']['documents_required_wrapper'] = [
      '#type' => 'container',
      '#prefix' => '<div id="documents-required-wrapper">',
      '#suffix' => '</div>',
      '#attributes' => [
        'class' => ['documents-configuration'],
      ],
    ];

    // Get the number of document items.
    $num_documents = $form_state->get('num_documents');
    if ($num_documents === NULL) {
      $documents_required = $instructions['documents_required'] ?? [];
      $num_documents = count($documents_required) ?: 1;
      $form_state->set('num_documents', $num_documents);
    }

    $documents_required = $instructions['documents_required'] ?? [];

    for ($i = 0; $i < $num_documents; $i++) {
      $document = $documents_required[$i] ?? [];

      // Better organized document container.
      $document_title = !empty($document['title']) ? $document['title'] : '';
      $form['instructions']['documents_section']['documents_required_wrapper']['documents_required'][$i] = [
        '#type' => 'details',
        '#title' => !empty($document_title)
          ? $this->t('@num. @title', ['@num' => $i + 1, '@title' => $document_title])
          : $this->t('@num. New Document Requirement', ['@num' => $i + 1]),
      // Open first item or empty items.
        '#open' => empty($document_title) || $i === 0,
        '#attributes' => [
          'class' => ['document-requirement-item'],
          'style' => 'margin-bottom: 1.5rem; background-color: #f8f9fa; border: 1px solid #dee2e6;',
        ],
      ];

      // Basic Information.
      $form['instructions']['documents_section']['documents_required_wrapper']['documents_required'][$i]['title'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Document Name'),
        '#default_value' => $document['title'] ?? '',
        '#required' => FALSE,
        '#maxlength' => 255,
        '#description' => $this->t('E.g., "Valid group registration certificate"'),
        '#attributes' => [
          'placeholder' => $this->t('Enter document name...'),
          'style' => 'font-weight: bold;',
        ],
      ];

      $form['instructions']['documents_section']['documents_required_wrapper']['documents_required'][$i]['subtitle'] = [
        '#type' => 'text_format',
        '#title' => $this->t('Instructions for Applicants'),
        '#default_value' => is_array($document['subtitle']) ? ($document['subtitle']['value'] ?? '') : ($document['subtitle'] ?? ''),
        '#format' => is_array($document['subtitle']) ? ($document['subtitle']['format'] ?? 'basic_html') : 'basic_html',
        '#required' => FALSE,
        '#rows' => 3,
        '#description' => $this->t('Instructions that will be shown to applicants for this document type'),
      ];

      // Example Images section with titles.
      $form['instructions']['documents_section']['documents_required_wrapper']['documents_required'][$i]['examples_container'] = [
        '#type' => 'fieldset',
        '#title' => $this->t('Example Images'),
        '#attributes' => [
          'style' => 'background-color: white; padding: 1rem; margin-top: 1rem; border: 1px solid #dee2e6; border-radius: 0.25rem;',
        ],
      ];

      // Get stored file IDs from UUID references.
      $default_fids = [];
      if (!empty($document['example_images'])) {
        // Convert UUID-based file references to current environment FIDs.
        $default_fids = $this->configFileService->resolveConfigFilesToFids($document['example_images']);
      }

      // Multiple file upload field.
      $form['instructions']['documents_section']['documents_required_wrapper']['documents_required'][$i]['examples_container']['images'] = [
        '#type' => 'managed_file',
        '#title' => $this->t('Example Images'),
        '#upload_location' => 'public://application_instructions/examples/',
        '#upload_validators' => [
          'FileExtension' => [
            'extensions' => 'webp jpg jpeg png gif',
          ],
          'FileSizeLimit' => [
          // 5MB per file
            'fileLimit' => 5 * 1024 * 1024,
          ],
        ],
        '#default_value' => $default_fids,
        '#description' => $this->t('Upload example images. Recommended format: WebP. Maximum file size: 5MB per file.'),
        '#multiple' => TRUE,
      ];

      // Caption for all images.
      $form['instructions']['documents_section']['documents_required_wrapper']['documents_required'][$i]['examples_container']['subtitle'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Images Caption'),
        '#default_value' => $document['examples_subtitle'] ?? '',
        '#description' => $this->t('Optional caption that appears below all example images'),
        '#maxlength' => 255,
        '#attributes' => [
          'placeholder' => $this->t('E.g., "Example of a valid certificate"'),
        ],
      ];

      // Additional Information Link.
      $form['instructions']['documents_section']['documents_required_wrapper']['documents_required'][$i]['link_container'] = [
        '#type' => 'details',
        '#title' => $this->t('Additional Information Link'),
        '#open' => !empty($document['link']['uri']),
        '#attributes' => [
          'style' => 'margin-top: 1rem;',
        ],
      ];

      $form['instructions']['documents_section']['documents_required_wrapper']['documents_required'][$i]['link_container']['uri'] = [
        '#type' => 'url',
        '#title' => $this->t('URL'),
        '#default_value' => $document['link']['uri'] ?? '',
        '#required' => FALSE,
        '#maxlength' => 2048,
        '#attributes' => [
          'placeholder' => 'https://example.com/document-info',
        ],
      ];

      $form['instructions']['documents_section']['documents_required_wrapper']['documents_required'][$i]['link_container']['title'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Link Text'),
        '#default_value' => $document['link']['title'] ?? '',
        '#required' => FALSE,
        '#maxlength' => 255,
        '#states' => [
          'required' => [
            ':input[name="instructions_tab[instructions][documents_section][documents_required_wrapper][documents_required][' . $i . '][link_container][uri]"]' => ['filled' => TRUE],
          ],
        ],
        '#attributes' => [
          'placeholder' => $this->t('More info about this certificate'),
        ],
      ];

      if ($i > 0) {
        $form['instructions']['documents_section']['documents_required_wrapper']['documents_required'][$i]['remove'] = [
          '#type' => 'submit',
          '#value' => $this->t('Remove this document'),
          '#name' => 'remove_document_' . $i,
          '#submit' => ['::removeDocumentCallback'],
          '#ajax' => [
            'callback' => '::updateDocumentsCallback',
            'wrapper' => 'documents-required-wrapper',
          ],
          '#limit_validation_errors' => [],
          '#attributes' => [
            'class' => ['button--danger'],
          ],
        ];
      }
    }

    // Add more documents button.
    $form['instructions']['documents_section']['documents_required_wrapper']['add_document'] = [
      '#type' => 'submit',
      '#value' => $this->t('Add another document type'),
      '#submit' => ['::addDocumentCallback'],
      '#ajax' => [
        'callback' => '::updateDocumentsCallback',
        'wrapper' => 'documents-required-wrapper',
      ],
      '#limit_validation_errors' => [],
      '#attributes' => [
        'class' => ['button--primary'],
      ],
    ];
  }

  /**
   * Callback for adding a new document.
   */
  public function addDocumentCallback(array &$form, FormStateInterface $form_state) {
    $num_documents = $form_state->get('num_documents');
    $form_state->set('num_documents', $num_documents + 1);
    $form_state->setRebuild();
  }

  /**
   * Callback for removing a document.
   */
  public function removeDocumentCallback(array &$form, FormStateInterface $form_state) {
    $num_documents = $form_state->get('num_documents');
    if ($num_documents > 1) {
      $form_state->set('num_documents', $num_documents - 1);
    }
    $form_state->setRebuild();
  }

  /**
   * Ajax callback for updating documents.
   */
  public function updateDocumentsCallback(array &$form, FormStateInterface $form_state) {
    return $form['instructions_tab']['instructions']['documents_section']['documents_required_wrapper'];
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $values = $form_state->getValues();
    $min = $values['general_settings']['application_settings']['min_group_members'];
    $max = $values['general_settings']['application_settings']['max_group_members'];

    if ($min > $max) {
      $form_state->setErrorByName('general_settings][application_settings][min_group_members', $this->t('Minimum group members cannot be greater than maximum group members.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $values = $form_state->getValues();
    $config = $this->config('api_application.settings');

    // Save general settings.
    $general = $values['general_settings'];
    $config
      ->set('min_group_members', $general['application_settings']['min_group_members'])
      ->set('max_group_members', $general['application_settings']['max_group_members'])
      ->set('max_file_size', $general['file_settings']['max_file_size'])
      ->set('allowed_extensions', $general['file_settings']['allowed_extensions'])
      ->set('application_prefix', $general['application_settings']['application_prefix'])
      ->set('api_key', $general['api_settings']['api_key']);

    // Save instructions settings.
    $instructions = $values['instructions_tab']['instructions'];

    // Process body field.
    $body_value = $instructions['page_settings']['body']['value'] ?? '';
    $body_format = $instructions['page_settings']['body']['format'] ?? 'basic_html';

    // Process documents required.
    $documents_required = [];
    if (!empty($instructions['documents_section']['documents_required_wrapper']['documents_required'])) {
      foreach ($instructions['documents_section']['documents_required_wrapper']['documents_required'] as $document) {
        // Get title from nested structure.
        $title = $document['title'] ?? '';
        if (!empty($title)) {
          // Process subtitle text_format field.
          $subtitle_value = $document['subtitle']['value'] ?? '';
          $subtitle_format = $document['subtitle']['format'] ?? 'basic_html';

          $doc_data = [
            'title' => $title,
            'subtitle' => [
              'value' => $subtitle_value,
              'format' => $subtitle_format,
            ],
            'link' => [
              'uri' => $document['link_container']['uri'] ?? '',
              'title' => $document['link_container']['title'] ?? '',
              'options' => [],
            ],
            'example_images' => [],
            'examples_subtitle' => $document['examples_container']['subtitle'] ?? '',
          ];

          // Process example images.
          if (!empty($document['examples_container']['images'])) {
            // Convert FIDs to UUID-based configuration format.
            $doc_data['example_images'] = $this->configFileService->convertFidsToConfigFormat($document['examples_container']['images']);

            // Ensure files are marked as permanent.
            $this->configFileService->ensureFilesPermanent($document['examples_container']['images']);
          }

          $documents_required[] = $doc_data;
        }
      }
    }

    // Save instructions configuration.
    $config->set('instructions', [
      'title' => $instructions['page_settings']['title'],
      'body' => [
        'value' => $body_value,
        'format' => $body_format,
      ],
      'documents_required' => $documents_required,
    ]);

    $config->save();

    parent::submitForm($form, $form_state);
  }

}
