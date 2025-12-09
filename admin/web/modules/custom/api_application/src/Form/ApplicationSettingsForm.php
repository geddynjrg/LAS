<?php

namespace Drupal\api_application\Form;

use Drupal\api_application\ApplicationStatusConstants;
use Drupal\api_application\Service\ConfigFileService;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\TypedConfigManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Utility\Token;
use Drupal\user\RoleInterface;
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
   * The token service.
   *
   * @var \Drupal\Core\Utility\Token
   */
  protected Token $token;

  /**
   * The module handler.
   *
   * @var \Drupal\Core\Extension\ModuleHandlerInterface
   */
  protected ModuleHandlerInterface $moduleHandler;

  /**
   * The logger service.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * Constructs a new ApplicationSettingsForm.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Config\TypedConfigManagerInterface $typed_config_manager
   *   The typed config manager.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\api_application\Service\ConfigFileService $config_file_service
   *   The config file service.
   * @param \Drupal\Core\Utility\Token $token
   *   The token service.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $module_handler
   *   The module handler.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    TypedConfigManagerInterface $typed_config_manager,
    EntityTypeManagerInterface $entity_type_manager,
    ConfigFileService $config_file_service,
    Token $token,
    ModuleHandlerInterface $module_handler,
    LoggerChannelFactoryInterface $logger_factory,
  ) {
    parent::__construct($config_factory, $typed_config_manager);
    $this->entityTypeManager = $entity_type_manager;
    $this->configFileService = $config_file_service;
    $this->token = $token;
    $this->moduleHandler = $module_handler;
    $this->logger = $logger_factory->get('api_application');
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('config.factory'),
      $container->get('config.typed'),
      $container->get('entity_type.manager'),
      $container->get('api_application.config_file_service'),
      $container->get('token'),
      $container->get('module_handler'),
      $container->get('logger.factory')
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
  protected function getEditableConfigNames(): array {
    return [
      'api_application.settings',
      'status_manager_notifications.settings',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('api_application.settings');

    $form['#tree'] = TRUE;
    $form['#attached']['library'][] = 'api_application/admin';

    // Add class for proper form handling.
    $form['#attributes']['class'][] = 'api-application-settings';

    // General Settings Section.
    $form['general_settings'] = [
      '#type' => 'details',
      '#title' => $this->t('General Settings'),
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

    // SMS Confirmation Settings.
    $form['general_settings']['sms_settings'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('SMS Confirmation Settings'),
    ];

    $form['general_settings']['sms_settings']['sms_confirmation_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable SMS Confirmations'),
      '#default_value' => $config->get('sms_confirmation_enabled') ?? TRUE,
      '#description' => $this->t('Allow sending SMS confirmation messages to group members.'),
    ];

    $form['general_settings']['sms_settings']['sms_confirmation_message'] = [
      '#type' => 'textarea',
      '#title' => $this->t('SMS Confirmation Message Template'),
      '#default_value' => $config->get('sms_confirmation_message') ?: '',
      '#description' => $this->t('Custom message template for SMS confirmations. Use [member:name] for member name and [confirmation:url] for confirmation link. Leave empty to use default message.'),
      '#rows' => 4,
      '#states' => [
        'visible' => [
          ':input[name="general_settings[sms_settings][sms_confirmation_enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['general_settings']['sms_settings']['auto_send_sms'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Auto-send SMS on Application Submission'),
      '#default_value' => $config->get('auto_send_sms') ?? FALSE,
      '#description' => $this->t('Automatically send confirmation SMS to all members when an application is submitted.'),
      '#states' => [
        'visible' => [
          ':input[name="general_settings[sms_settings][sms_confirmation_enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['general_settings']['sms_settings']['frontend_base_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Frontend Base URL'),
      '#default_value' => $config->get('frontend_base_url') ?: '',
      '#description' => $this->t('Base URL of your frontend application (e.g., https://app.example.com). SMS links will direct users to this frontend instead of the backend confirmation page.'),
      '#placeholder' => 'https://app.example.com',
      '#element_validate' => ['::validateFrontendUrl'],
      '#states' => [
        'visible' => [
          ':input[name="general_settings[sms_settings][sms_confirmation_enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['general_settings']['sms_settings']['frontend_confirmation_path'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Frontend Response Path'),
      '#default_value' => $config->get('frontend_confirmation_path') ?: '/response/{token}',
      '#description' => $this->t('Path on your frontend where members can accept or decline participation. Use {token} as placeholder for the confirmation token.'),
      '#placeholder' => '/response/{token}',
      '#states' => [
        'visible' => [
          ':input[name="general_settings[sms_settings][sms_confirmation_enabled]"]' => ['checked' => TRUE],
        ],
      ],
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

    // Instructions Section.
    $form['instructions_tab'] = [
      '#type' => 'details',
      '#title' => $this->t('Instructions'),
    ];

    // Include the instructions form elements.
    $this->buildInstructionsForm($form['instructions_tab'], $form_state);

    // Notifications Section.
    $form['notifications_tab'] = [
      '#type' => 'details',
      '#title' => $this->t('Notifications'),
    ];

    // Include the notifications form elements.
    $this->buildNotificationsForm($form['notifications_tab'], $form_state);

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
   * Build the notifications form elements.
   */
  protected function buildNotificationsForm(&$form, FormStateInterface $form_state): void {
    $config = $this->config('status_manager_notifications.settings');

    $form['notifications'] = [
      '#type' => 'container',
      '#tree' => TRUE,
    ];

    // Attach SMS counter library.
    $form['#attached']['library'][] = 'status_manager_notifications/notification_settings_form';

    // Global settings.
    $form['notifications']['global'] = [
      '#type' => 'details',
      '#title' => $this->t('Global Settings'),
      '#open' => TRUE,
    ];

    $form['notifications']['global']['prefer_sms'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Prefer SMS'),
      '#description' => $this->t('Try SMS first, fallback to email if no phone number is available or SMS fails.'),
      '#default_value' => $config->get('global.prefer_sms') ?? TRUE,
    ];

    $form['notifications']['global']['from_email'] = [
      '#type' => 'email',
      '#title' => $this->t('From Email'),
      '#description' => $this->t('Default sender email address.'),
      '#default_value' => $config->get('global.from_email') ?? '',
      '#required' => TRUE,
    ];

    $form['notifications']['global']['from_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('From Name'),
      '#description' => $this->t('Default sender name.'),
      '#default_value' => $config->get('global.from_name') ?? 'Uwezo',
      '#required' => TRUE,
    ];

    // Provider settings.
    $form['notifications']['providers'] = [
      '#type' => 'details',
      '#title' => $this->t('Delivery Providers'),
      '#open' => FALSE,
      '#description' => $this->t('Configure email and SMS delivery settings.'),
    ];

    $this->buildProviderSettings($form['notifications'], $config);

    // Status notifications.
    $form['notifications']['status_notifications'] = [
      '#type' => 'details',
      '#title' => $this->t('Status Messages'),
      '#open' => TRUE,
      '#description' => $this->t('Configure messages sent when application status changes. Use tokens to personalize content.'),
    ];

    // Token help.
    if ($this->moduleHandler->moduleExists('token')) {
      $form['notifications']['status_notifications']['token_help'] = [
        '#theme' => 'token_tree_link',
        '#token_types' => ['application', 'status_change', 'user'],
        '#global_types' => FALSE,
        '#weight' => -10,
      ];
    }

    $this->buildStatusNotificationSettings($form['notifications'], $form_state, $config);
  }

  /**
   * Validates the frontend URL field.
   *
   * @param array $element
   *   The form element.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function validateFrontendUrl(array &$element, FormStateInterface $form_state) {
    $value = $element['#value'];

    // Allow empty values.
    if (empty($value)) {
      return;
    }

    // Basic URL format validation that allows underscores in domain names.
    if (!preg_match('/^https?:\/\/[a-zA-Z0-9._-]+(?:\.[a-zA-Z]{2,})?(?::\d+)?(?:\/.*)?$/', $value)) {
      $form_state->setError($element, $this->t('Please enter a valid URL starting with http:// or https://'));
      return;
    }

    // Additional validation: ensure it's a proper URL structure.
    $parsed = parse_url($value);
    if (!$parsed || !isset($parsed['scheme']) || !isset($parsed['host'])) {
      $form_state->setError($element, $this->t('Please enter a valid URL with a proper domain name.'));
      return;
    }

    // Ensure scheme is http or https.
    if (!in_array($parsed['scheme'], ['http', 'https'])) {
      $form_state->setError($element, $this->t('URL must start with http:// or https://'));
    }
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
      ->set('api_key', $general['api_settings']['api_key'])
      ->set('sms_confirmation_enabled', $general['sms_settings']['sms_confirmation_enabled'])
      ->set('sms_confirmation_message', $general['sms_settings']['sms_confirmation_message'])
      ->set('auto_send_sms', $general['sms_settings']['auto_send_sms'])
      ->set('frontend_base_url', $general['sms_settings']['frontend_base_url'])
      ->set('frontend_confirmation_path', $general['sms_settings']['frontend_confirmation_path']);

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

    // Save notification settings.
    $this->saveNotificationSettings($form_state);

    parent::submitForm($form, $form_state);
  }

  /**
   * Save notification settings to status_manager_notifications.settings config.
   */
  protected function saveNotificationSettings(FormStateInterface $form_state): void {
    $config = $this->config('status_manager_notifications.settings');
    $values = $form_state->getValues();

    // Check if notifications tab exists in values.
    if (isset($values['notifications_tab']['notifications'])) {
      $notifications = $values['notifications_tab']['notifications'];

      // Save global settings.
      if (isset($notifications['global'])) {
        $config->set('global', $notifications['global']);
      }

      // Save provider settings.
      if (isset($notifications['providers'])) {
        $config->set('providers', $notifications['providers']);
      }

      // Save status notifications.
      if (isset($notifications['status_notifications'])) {
        foreach ($notifications['status_notifications'] as $status_id => $status_config) {
          // Filter out empty admin_roles checkboxes.
          if (isset($status_config['admin_roles'])) {
            $status_config['admin_roles'] = array_values(array_filter($status_config['admin_roles']));
          }

          // Remove old message field if it exists (migration cleanup).
          unset($status_config['message']);

          $config->set("status_notifications.{$status_id}", $status_config);
        }
      }

      $config->save();
    }
  }

  /**
   * Build provider settings section.
   */
  protected function buildProviderSettings(array &$form, $config): void {
    // Email provider.
    $form['providers']['email'] = [
      '#type' => 'details',
      '#title' => $this->t('Customer Email'),
      '#open' => FALSE,
    ];

    $form['providers']['email']['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enabled'),
      '#default_value' => $config->get('providers.email.enabled') ?? TRUE,
    ];

    $form['providers']['email']['from_email'] = [
      '#type' => 'email',
      '#title' => $this->t('From Email'),
      '#default_value' => $config->get('providers.email.from_email') ?? '',
      '#states' => [
        'visible' => [':input[name="notifications_tab[notifications][providers][email][enabled]"]' => ['checked' => TRUE]],
      ],
    ];

    $form['providers']['email']['from_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('From Name'),
      '#default_value' => $config->get('providers.email.from_name') ?? '',
      '#states' => [
        'visible' => [':input[name="notifications_tab[notifications][providers][email][enabled]"]' => ['checked' => TRUE]],
      ],
    ];

    // Admin email provider.
    $form['providers']['email_admin'] = [
      '#type' => 'details',
      '#title' => $this->t('Admin Email'),
      '#open' => FALSE,
    ];

    $form['providers']['email_admin']['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enabled'),
      '#default_value' => $config->get('providers.email_admin.enabled') ?? TRUE,
    ];

    $form['providers']['email_admin']['from_email'] = [
      '#type' => 'email',
      '#title' => $this->t('From Email'),
      '#default_value' => $config->get('providers.email_admin.from_email') ?? '',
      '#states' => [
        'visible' => [':input[name="notifications_tab[notifications][providers][email_admin][enabled]"]' => ['checked' => TRUE]],
      ],
    ];

    $form['providers']['email_admin']['from_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('From Name'),
      '#default_value' => $config->get('providers.email_admin.from_name') ?? '',
      '#states' => [
        'visible' => [':input[name="notifications_tab[notifications][providers][email_admin][enabled]"]' => ['checked' => TRUE]],
      ],
    ];

    // SMS provider.
    $form['providers']['sms'] = [
      '#type' => 'details',
      '#title' => $this->t('SMS'),
      '#open' => FALSE,
      '#description' => $this->t('Uses the system-wide SMS provider configured in SMS Providers settings.'),
    ];

    $form['providers']['sms']['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enabled'),
      '#description' => $this->t('Enable SMS notifications for status changes.'),
      '#default_value' => $config->get('providers.sms.enabled') ?? FALSE,
    ];
  }

  /**
   * Build status notification settings.
   */
  protected function buildStatusNotificationSettings(array &$form, FormStateInterface $form_state, $config): void {
    $statuses = $this->getApplicationStatuses();
    $roles = $this->getUserRoles();

    foreach ($statuses as $status_id => $status_label) {
      $form['status_notifications'][$status_id] = [
        '#type' => 'details',
        '#title' => $status_label,
        '#open' => FALSE,
      ];

      $status_config = $config->get("status_notifications.{$status_id}") ?? [];

      $form['status_notifications'][$status_id]['enabled'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Send message'),
        '#default_value' => $status_config['enabled'] ?? FALSE,
      ];

      $form['status_notifications'][$status_id]['recipient'] = [
        '#type' => 'select',
        '#title' => $this->t('Send to'),
        '#options' => [
          'customer' => $this->t('Customer (Application Owner)'),
          'admin' => $this->t('Administrators (by role)'),
        ],
        '#default_value' => $status_config['recipient'] ?? 'customer',
        '#states' => [
          'visible' => [
            ":input[name=\"notifications_tab[notifications][status_notifications][{$status_id}][enabled]\"]" => ['checked' => TRUE],
          ],
        ],
      ];

      $form['status_notifications'][$status_id]['admin_roles'] = [
        '#type' => 'checkboxes',
        '#title' => $this->t('Admin Roles'),
        '#description' => $this->t('Which administrator roles to notify.'),
        '#options' => $roles,
        '#default_value' => $status_config['admin_roles'] ?? [],
        '#states' => [
          'visible' => [
            ":input[name=\"notifications_tab[notifications][status_notifications][{$status_id}][enabled]\"]" => ['checked' => TRUE],
            ":input[name=\"notifications_tab[notifications][status_notifications][{$status_id}][recipient]\"]" => ['value' => 'admin'],
          ],
        ],
      ];

      $form['status_notifications'][$status_id]['subject'] = [
        '#type' => 'textfield',
        '#title' => $this->t('Subject'),
        '#description' => $this->t('Email subject line (supports tokens).'),
        '#default_value' => $status_config['subject'] ?? '',
        '#states' => [
          'visible' => [
            ":input[name=\"notifications_tab[notifications][status_notifications][{$status_id}][enabled]\"]" => ['checked' => TRUE],
          ],
        ],
      ];

      $form['status_notifications'][$status_id]['email_message'] = [
        '#type' => 'textarea',
        '#title' => $this->t('Email Message'),
        '#description' => $this->t('Message sent via email (supports tokens).'),
        '#default_value' => $status_config['email_message'] ?? $status_config['message'] ?? '',
        '#rows' => 6,
        '#states' => [
          'visible' => [
            ":input[name=\"notifications_tab[notifications][status_notifications][{$status_id}][enabled]\"]" => ['checked' => TRUE],
          ],
        ],
      ];

      $sms_message = $status_config['sms_message'] ?? $status_config['message'] ?? '';
      $char_count = mb_strlen($sms_message);

      $form['status_notifications'][$status_id]['sms_message'] = [
        '#type' => 'textarea',
        '#title' => $this->t('SMS Message'),
        '#description' => $this->t('Message sent via SMS (supports tokens). Character count: <span class="sms-count" id="sms-count-@id">@count</span> / 160', [
          '@id' => $status_id,
          '@count' => $char_count,
        ]),
        '#default_value' => $sms_message,
        '#rows' => 3,
        '#attributes' => [
          'class' => ['sms-message-field'],
          'data-counter-id' => "sms-count-{$status_id}",
          'id' => "sms-message-{$status_id}",
        ],
        '#states' => [
          'visible' => [
            ":input[name=\"notifications_tab[notifications][status_notifications][{$status_id}][enabled]\"]" => ['checked' => TRUE],
          ],
        ],
      ];
    }
  }

  /**
   * Get application statuses.
   */
  protected function getApplicationStatuses(): array {
    try {
      $field_definitions = $this->entityTypeManager
        ->getDefinition('application')
        ->getClass()::baseFieldDefinitions($this->entityTypeManager->getDefinition('application'));

      if (isset($field_definitions['status'])) {
        $allowed_values = $field_definitions['status']->getSetting('allowed_values');
        return $allowed_values;
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to load application statuses: @error', [
        '@error' => $e->getMessage(),
      ]);
    }

    return ApplicationStatusConstants::getAllowedValues();
  }

  /**
   * Get available user roles.
   */
  protected function getUserRoles(): array {
    $roles = [];
    $role_storage = $this->entityTypeManager->getStorage('user_role');

    foreach ($role_storage->loadMultiple() as $role_id => $role) {
      if ($role_id !== RoleInterface::ANONYMOUS_ID && $role_id !== RoleInterface::AUTHENTICATED_ID) {
        $roles[$role_id] = $role->label();
      }
    }

    return $roles;
  }

}
