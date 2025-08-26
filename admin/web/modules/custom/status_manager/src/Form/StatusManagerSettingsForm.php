<?php

namespace Drupal\status_manager\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Entity\EntityFieldManagerInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configure Status Manager settings for this site.
 */
class StatusManagerSettingsForm extends ConfigFormBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The entity field manager.
   *
   * @var \Drupal\Core\Entity\EntityFieldManagerInterface
   */
  protected $entityFieldManager;

  /**
   * The module handler.
   *
   * @var \Drupal\Core\Extension\ModuleHandlerInterface
   */
  protected $moduleHandler;

  /**
   * The notification provider manager.
   *
   * @var \Drupal\status_manager_notifications\Plugin\NotificationProviderManager|null
   */
  protected $providerManager;

  /**
   * The template manager.
   *
   * @var \Drupal\status_manager_notifications\Service\TemplateManager|null
   */
  protected $templateManager;

  /**
   * Constructs a StatusManagerSettingsForm object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Entity\EntityFieldManagerInterface $entity_field_manager
   *   The entity field manager.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $module_handler
   *   The module handler.
   * @param \Drupal\status_manager_notifications\Plugin\NotificationProviderManager|null $provider_manager
   *   The notification provider manager.
   * @param \Drupal\status_manager_notifications\Service\TemplateManager|null $template_manager
   *   The template manager.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    EntityFieldManagerInterface $entity_field_manager,
    ModuleHandlerInterface $module_handler,
    $provider_manager = NULL,
    $template_manager = NULL,
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->entityFieldManager = $entity_field_manager;
    $this->moduleHandler = $module_handler;
    $this->providerManager = $provider_manager;
    $this->templateManager = $template_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    $provider_manager = NULL;
    $template_manager = NULL;

    // Try to get notification services if the module is enabled.
    if ($container->get('module_handler')->moduleExists('status_manager_notifications')) {
      try {
        $provider_manager = $container->get('plugin.manager.notification_provider');
        $template_manager = $container->get('status_manager_notifications.template_manager');
      }
      catch (\Exception $e) {
        // Services not available - continue without them.
      }
    }

    return new static(
      $container->get('entity_type.manager'),
      $container->get('entity_field.manager'),
      $container->get('module_handler'),
      $provider_manager,
      $template_manager
    );
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    $config_names = ['status_manager.settings'];

    // Add notification config if module is enabled.
    if ($this->moduleHandler->moduleExists('status_manager_notifications')) {
      $config_names[] = 'status_manager_notifications.settings';
    }

    return $config_names;
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'status_manager_settings';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('status_manager.settings');

    $form['#tree'] = TRUE;
    $form['#attached']['library'][] = 'status_manager/admin';
    $form['#attached']['library'][] = 'core/drupal.dialog.ajax';
    $form['#attributes']['class'][] = 'status-manager-settings-form';

    // General settings.
    $form['general'] = [
      '#type' => 'details',
      '#title' => $this->t('General Settings'),
      '#open' => TRUE,
    ];

    $form['general']['auto_tracking_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable automatic status tracking'),
      '#description' => $this->t('When enabled, status changes will be automatically tracked when entities are updated.'),
      '#default_value' => $config->get('general.auto_tracking_enabled') ?? TRUE,
    ];

    $form['general']['tracking_mode'] = [
      '#type' => 'radios',
      '#title' => $this->t('Tracking Mode'),
      '#description' => $this->t('Choose how you want to configure status tracking for entities.'),
      '#options' => [
        'configured' => $this->t('<strong>Configured Entities Only</strong> - Track only entities you specifically configure below'),
        'fallback' => $this->t('<strong>Automatic Detection</strong> - Track common entity types with standard status fields automatically'),
        'both' => $this->t('<strong>Both</strong> - Use configured entities first, then fall back to automatic detection'),
      ],
      '#default_value' => $config->get('general.tracking_mode') ?? 'both',
      '#states' => [
        'visible' => [
          ':input[name="general[auto_tracking_enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // Add explanation for each mode.
    $form['general']['mode_explanation'] = [
      '#type' => 'container',
      '#states' => [
        'visible' => [
          ':input[name="general[auto_tracking_enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['general']['mode_explanation']['configured_help'] = [
      '#type' => 'markup',
      '#markup' => '<div class="tracking-mode-help tracking-mode-configured" style="display: none;"><div class="messages messages--info"><strong>Configured Entities Mode:</strong><ul><li>Only entities you configure in the "Entity Type Mappings" section below will be tracked</li><li>You have full control over which fields are monitored</li><li>Best for specific, controlled tracking</li></ul></div></div>',
    ];

    $form['general']['mode_explanation']['fallback_help'] = [
      '#type' => 'markup',
      '#markup' => '<div class="tracking-mode-help tracking-mode-fallback" style="display: none;"><div class="messages messages--warning"><strong>Automatic Detection Mode:</strong><ul><li>Automatically tracks common entity types: <code>application</code>, <code>node</code>, <code>user</code></li><li>Looks for standard status fields: <code>status</code>, <code>field_status</code>, <code>moderation_state</code></li><li>No configuration needed, but less control</li></ul></div></div>',
    ];

    $form['general']['mode_explanation']['both_help'] = [
      '#type' => 'markup',
      '#markup' => '<div class="tracking-mode-help tracking-mode-both" style="display: none;"><div class="messages messages--status"><strong>Both Modes:</strong><ul><li>First checks your configured entities below</li><li>If no configuration found, falls back to automatic detection</li><li>Recommended for most use cases</li></ul></div></div>',
    ];

    $form['general']['default_notification_type'] = [
      '#type' => 'select',
      '#title' => $this->t('Default notification type'),
      '#description' => $this->t('The default notification type for new status changes.'),
      '#options' => [
        'none' => $this->t('None'),
        'email' => $this->t('Email'),
        'sms' => $this->t('SMS'),
        'both' => $this->t('Email and SMS'),
      ],
      '#default_value' => $config->get('general.default_notification_type') ?? 'none',
      '#states' => [
        'visible' => [
          ':input[name="general[auto_tracking_enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['general']['history_limit'] = [
      '#type' => 'number',
      '#title' => $this->t('History display limit'),
      '#description' => $this->t('Maximum number of status changes to display in history tables. Set to 0 for no limit.'),
      '#default_value' => $config->get('general.history_limit') ?? 50,
      '#min' => 0,
      '#max' => 1000,
    ];

    $form['general']['cleanup_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable automatic cleanup'),
      '#description' => $this->t('Automatically delete old status change records after a specified period.'),
      '#default_value' => $config->get('general.cleanup_enabled') ?? FALSE,
    ];

    $form['general']['cleanup_days'] = [
      '#type' => 'number',
      '#title' => $this->t('Cleanup after (days)'),
      '#description' => $this->t('Delete status change records older than this many days.'),
      '#default_value' => $config->get('general.cleanup_days') ?? 365,
      '#min' => 1,
      '#states' => [
        'visible' => [
          ':input[name="general[cleanup_enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // Entity type mappings.
    $form['entity_mappings'] = [
      '#type' => 'details',
      '#title' => $this->t('Entity Type Mappings'),
      '#description' => $this->t('Configure specific entity types and fields for status tracking. This section is used when "Configured Entities" or "Both" tracking mode is selected.'),
      '#open' => TRUE,
      '#states' => [
        'visible' => [
          ':input[name="general[auto_tracking_enabled]"]' => ['checked' => TRUE],
        ],
        'invisible' => [
          ':input[name="general[tracking_mode]"]' => ['value' => 'fallback'],
        ],
      ],
    ];

    // Add automatic detection info.
    $form['automatic_detection'] = [
      '#type' => 'details',
      '#title' => $this->t('Automatic Detection Info'),
      '#description' => $this->t('Information about what will be automatically tracked when using "Automatic Detection" or "Both" modes.'),
      '#open' => FALSE,
      '#states' => [
        'visible' => [
          ':input[name="general[auto_tracking_enabled]"]' => ['checked' => TRUE],
        ],
        'invisible' => [
          ':input[name="general[tracking_mode]"]' => ['value' => 'configured'],
        ],
      ],
    ];

    $form['automatic_detection']['info'] = [
      '#type' => 'markup',
      '#markup' => '
        <div class="automatic-detection-info">
          <h4>' . $this->t('Automatically Tracked Entity Types:') . '</h4>
          <table class="table">
            <thead>
              <tr>
                <th>' . $this->t('Entity Type') . '</th>
                <th>' . $this->t('Tracked Fields') . '</th>
                <th>' . $this->t('Description') . '</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>application</code></td>
                <td><code>status</code>, <code>field_status</code>, <code>field_application_status</code></td>
                <td>' . $this->t('Application entities (loan applications, etc.)') . '</td>
              </tr>
              <tr>
                <td><code>node</code></td>
                <td><code>status</code>, <code>moderation_state</code></td>
                <td>' . $this->t('Content nodes and their moderation states') . '</td>
              </tr>
              <tr>
                <td><code>user</code></td>
                <td><code>status</code></td>
                <td>' . $this->t('User account status changes') . '</td>
              </tr>
            </tbody>
          </table>
          <p><em>' . $this->t('Note: Automatic detection only tracks entities that have the specified fields and when those field values actually change.') . '</em></p>
        </div>
      ',
    ];

    $entity_mappings = $config->get('entity_mappings') ?? [];
    $content_entity_types = $this->getContentEntityTypes();

    foreach ($content_entity_types as $entity_type_id => $entity_type) {
      $form['entity_mappings'][$entity_type_id] = [
        '#type' => 'details',
        '#title' => $entity_type->getLabel() . ' (' . $entity_type_id . ')',
        '#open' => !empty($entity_mappings[$entity_type_id]['enabled']),
      ];

      $form['entity_mappings'][$entity_type_id]['enabled'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Enable tracking for @entity_type', ['@entity_type' => $entity_type->getLabel()]),
        '#default_value' => $entity_mappings[$entity_type_id]['enabled'] ?? FALSE,
      ];

      // Get fields for this entity type.
      $fields = $this->getStatusFields($entity_type_id);
      if (!empty($fields)) {
        $form['entity_mappings'][$entity_type_id]['tracked_fields'] = [
          '#type' => 'checkboxes',
          '#title' => $this->t('Fields to track'),
          '#description' => $this->t('Select which fields should be monitored for status changes.'),
          '#options' => $fields,
          '#default_value' => $entity_mappings[$entity_type_id]['tracked_fields'] ?? [],
          '#states' => [
            'visible' => [
              ':input[name="entity_mappings[' . $entity_type_id . '][enabled]"]' => ['checked' => TRUE],
            ],
          ],
        ];

        $form['entity_mappings'][$entity_type_id]['notification_type'] = [
          '#type' => 'select',
          '#title' => $this->t('Default notification type'),
          '#options' => [
            'none' => $this->t('None'),
            'email' => $this->t('Email'),
            'sms' => $this->t('SMS'),
            'both' => $this->t('Email and SMS'),
          ],
          '#default_value' => $entity_mappings[$entity_type_id]['notification_type'] ?? 'none',
          '#states' => [
            'visible' => [
              ':input[name="entity_mappings[' . $entity_type_id . '][enabled]"]' => ['checked' => TRUE],
            ],
          ],
        ];
      }
      else {
        $form['entity_mappings'][$entity_type_id]['no_fields'] = [
          '#markup' => '<p><em>' . $this->t('No suitable status fields found for this entity type.') . '</em></p>',
          '#states' => [
            'visible' => [
              ':input[name="entity_mappings[' . $entity_type_id . '][enabled]"]' => ['checked' => TRUE],
            ],
          ],
        ];
      }
    }

    // Notification settings - enhanced with provider and template selection
    // if module is enabled.
    $this->buildNotificationSettings($form, $form_state, $config);

    // Display settings.
    $form['display'] = [
      '#type' => 'details',
      '#title' => $this->t('Display Settings'),
      '#open' => FALSE,
    ];

    $form['display']['show_entity_links'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show links to target entities'),
      '#description' => $this->t('Display clickable links to the entities being tracked in status change lists.'),
      '#default_value' => $config->get('display.show_entity_links') ?? TRUE,
    ];

    $form['display']['show_user_info'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show user information'),
      '#description' => $this->t('Display information about the user who made the status change.'),
      '#default_value' => $config->get('display.show_user_info') ?? TRUE,
    ];

    $form['display']['date_format'] = [
      '#type' => 'select',
      '#title' => $this->t('Date format'),
      '#description' => $this->t('How to display dates in status change lists.'),
      '#options' => [
        'short' => $this->t('Short (e.g., 12/31/2023 - 2:30pm)'),
        'medium' => $this->t('Medium (e.g., Sun, 12/31/2023 - 14:30)'),
        'long' => $this->t('Long (e.g., Sunday, December 31, 2023 - 2:30pm)'),
        'custom' => $this->t('Custom format'),
      ],
      '#default_value' => $config->get('display.date_format') ?? 'short',
    ];

    $form['display']['custom_date_format'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Custom date format'),
      '#description' => $this->t('PHP date format string. See <a href="@url" target="_blank">PHP date documentation</a>.', [
        '@url' => 'https://www.php.net/manual/en/datetime.format.php',
      ]),
      '#default_value' => $config->get('display.custom_date_format') ?? 'Y-m-d H:i:s',
      '#states' => [
        'visible' => [
          ':input[name="display[date_format]"]' => ['value' => 'custom'],
        ],
        'required' => [
          ':input[name="display[date_format]"]' => ['value' => 'custom'],
        ],
      ],
    ];

    // Performance settings.
    $form['performance'] = [
      '#type' => 'details',
      '#title' => $this->t('Performance Settings'),
      '#open' => FALSE,
    ];

    $form['performance']['batch_size'] = [
      '#type' => 'number',
      '#title' => $this->t('Batch processing size'),
      '#description' => $this->t('Number of status changes to process at once during bulk operations.'),
      '#default_value' => $config->get('performance.batch_size') ?? 100,
      '#min' => 1,
      '#max' => 1000,
    ];

    $form['performance']['cache_enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable caching'),
      '#description' => $this->t('Cache status change data to improve performance.'),
      '#default_value' => $config->get('performance.cache_enabled') ?? TRUE,
    ];

    $form['performance']['cache_lifetime'] = [
      '#type' => 'number',
      '#title' => $this->t('Cache lifetime (seconds)'),
      '#description' => $this->t('How long to cache status change data.'),
      '#default_value' => $config->get('performance.cache_lifetime') ?? 3600,
      '#min' => 60,
      '#states' => [
        'visible' => [
          ':input[name="performance[cache_enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * Builds the notification settings with provider and template selection.
   */
  protected function buildNotificationSettings(array &$form, FormStateInterface $form_state, $config) {
    $form['notifications'] = [
      '#type' => 'details',
      '#title' => $this->t('Notification Settings'),
      '#open' => FALSE,
    ];

    // Check if status_manager_notifications module is enabled.
    if (!$this->moduleHandler->moduleExists('status_manager_notifications')) {
      // Show basic notification settings only.
      $form['notifications']['not_available'] = [
        '#markup' => '<div class="messages messages--warning">' .
        $this->t('Advanced notification features are not available. Enable the Status Manager Notifications module for provider and template management.') .
        '</div>',
      ];

      $form['notifications']['email_enabled'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Enable email notifications'),
        '#default_value' => $config->get('notifications.email_enabled') ?? TRUE,
      ];

      $form['notifications']['email_from'] = [
        '#type' => 'email',
        '#title' => $this->t('From email address'),
        '#description' => $this->t('Email address to use as sender for notifications. Leave empty to use site default.'),
        '#default_value' => $config->get('notifications.email_from') ?? '',
        '#states' => [
          'visible' => [
            ':input[name="notifications[email_enabled]"]' => ['checked' => TRUE],
          ],
        ],
      ];

      $form['notifications']['sms_enabled'] = [
        '#type' => 'checkbox',
        '#title' => $this->t('Enable SMS notifications'),
        '#default_value' => $config->get('notifications.sms_enabled') ?? FALSE,
      ];

      $form['notifications']['sms_provider'] = [
        '#type' => 'select',
        '#title' => $this->t('SMS provider'),
        '#options' => [
          'twilio' => $this->t('Twilio'),
          'nexmo' => $this->t('Vonage (Nexmo)'),
          'custom' => $this->t('Custom implementation'),
        ],
        '#default_value' => $config->get('notifications.sms_provider') ?? 'twilio',
        '#states' => [
          'visible' => [
            ':input[name="notifications[sms_enabled]"]' => ['checked' => TRUE],
          ],
        ],
      ];

      return;
    }

    // Advanced notification settings with provider and template selection.
    if (!$this->providerManager || !$this->templateManager) {
      $form['notifications']['service_error'] = [
        '#markup' => '<div class="messages messages--error">' .
        $this->t('Notification services are not available. Please check the Status Manager Notifications module configuration.') .
        '</div>',
      ];
      return;
    }

    // Get notification config.
    $notification_config = $this->config('status_manager_notifications.settings');

    // Add status notification mapper button.
    $form['notifications']['status_mapper'] = [
      '#type' => 'details',
      '#title' => $this->t('Status Notification Mapping'),
      '#open' => TRUE,
      '#weight' => -10,
    ];

    $form['notifications']['status_mapper']['description'] = [
      '#markup' => '<p>' . $this->t('Configure which statuses send notifications to customers, admin users, or both.') . '</p>',
    ];

    $form['notifications']['status_mapper']['configure_button'] = [
      '#type' => 'link',
      '#title' => $this->t('Configure Status Notification Mapper'),
      '#url' => Url::fromRoute('status_manager_notifications.status_notification_mapper'),
      '#attributes' => [
        'class' => ['button', 'button--primary', 'use-ajax'],
        'data-dialog-type' => 'modal',
        'data-dialog-options' => json_encode([
          'width' => '90%',
          'height' => '80%',
          'title' => $this->t('Status Notification Mapper'),
        ]),
      ],
    ];

    // Email provider selection.
    $form['notifications']['email'] = [
      '#type' => 'details',
      '#title' => $this->t('Email Notifications'),
      '#open' => TRUE,
    ];

    $form['notifications']['email']['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable email notifications'),
      '#default_value' => $config->get('notifications.email_enabled') ?? TRUE,
    ];

    // Get email providers.
    $email_providers = $this->providerManager->getProvidersForType('email');
    $email_options = [];
    foreach ($email_providers as $id => $definition) {
      $email_options[$id] = $definition['label'];
    }

    if (!empty($email_options)) {
      $form['notifications']['email']['provider'] = [
        '#type' => 'select',
        '#title' => $this->t('Email Provider'),
        '#description' => $this->t('Choose the email service provider to use for sending notifications.'),
        '#options' => $email_options,
        '#default_value' => $notification_config->get('email.active_provider'),
        '#empty_option' => $this->t('- Select Provider -'),
        '#states' => [
          'visible' => [
            ':input[name="notifications[email][enabled]"]' => ['checked' => TRUE],
          ],
          'required' => [
            ':input[name="notifications[email][enabled]"]' => ['checked' => TRUE],
          ],
        ],
      ];
    }

    // Get email templates.
    $email_templates = $this->templateManager->getTemplates('email');
    $email_template_options = [
      'auto' => $this->t('Auto-select based on entity and status'),
    ];
    foreach ($email_templates as $id => $template) {
      $email_template_options[$id] = $template['subject'] ?? $id;
    }

    $form['notifications']['email']['default_template'] = [
      '#type' => 'select',
      '#title' => $this->t('Default Email Template'),
      '#description' => $this->t('Choose the default template for email notifications. Auto-select will choose the most appropriate template based on the entity type and status.'),
      '#options' => $email_template_options,
      '#default_value' => $notification_config->get('email.default_template') ?? 'auto',
      '#states' => [
        'visible' => [
          ':input[name="notifications[email][enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // SMS provider selection.
    $form['notifications']['sms'] = [
      '#type' => 'details',
      '#title' => $this->t('SMS Notifications'),
      '#open' => FALSE,
    ];

    $form['notifications']['sms']['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable SMS notifications'),
      '#default_value' => $config->get('notifications.sms_enabled') ?? FALSE,
    ];

    // Get SMS providers.
    $sms_providers = $this->providerManager->getProvidersForType('sms');
    $sms_options = [];
    foreach ($sms_providers as $id => $definition) {
      $sms_options[$id] = $definition['label'];
    }

    if (!empty($sms_options)) {
      $form['notifications']['sms']['provider'] = [
        '#type' => 'select',
        '#title' => $this->t('SMS Provider'),
        '#description' => $this->t('Choose the SMS service provider to use for sending notifications.'),
        '#options' => $sms_options,
        '#default_value' => $notification_config->get('sms.active_provider'),
        '#empty_option' => $this->t('- Select Provider -'),
        '#states' => [
          'visible' => [
            ':input[name="notifications[sms][enabled]"]' => ['checked' => TRUE],
          ],
          'required' => [
            ':input[name="notifications[sms][enabled]"]' => ['checked' => TRUE],
          ],
        ],
      ];
    }

    // Get SMS templates.
    $sms_templates = $this->templateManager->getTemplates('sms');
    $sms_template_options = [
      'auto' => $this->t('Auto-select based on entity and status'),
    ];
    foreach ($sms_templates as $id => $template) {
      $sms_template_options[$id] = mb_substr($template['message'] ?? $id, 0, 50) . '...';
    }

    $form['notifications']['sms']['default_template'] = [
      '#type' => 'select',
      '#title' => $this->t('Default SMS Template'),
      '#description' => $this->t('Choose the default template for SMS notifications. Auto-select will choose the most appropriate template based on the entity type and status.'),
      '#options' => $sms_template_options,
      '#default_value' => $notification_config->get('sms.default_template') ?? 'auto',
      '#states' => [
        'visible' => [
          ':input[name="notifications[sms][enabled]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // Entity-specific notification settings.
    $form['notifications']['entity_settings'] = [
      '#type' => 'details',
      '#title' => $this->t('Entity-Specific Settings'),
      '#description' => $this->t('Override notification settings for specific entity types.'),
      '#open' => FALSE,
    ];

    // Get entity mappings to show relevant entity types.
    $entity_mappings = $config->get('entity_mappings') ?? [];
    $enabled_entities = [];
    foreach ($entity_mappings as $entity_type_id => $mapping) {
      if (!empty($mapping['enabled'])) {
        $enabled_entities[] = $entity_type_id;
      }
    }

    if (!empty($enabled_entities)) {
      foreach ($enabled_entities as $entity_type_id) {
        $entity_type = $this->entityTypeManager->getDefinition($entity_type_id);

        $form['notifications']['entity_settings'][$entity_type_id] = [
          '#type' => 'details',
          '#title' => $entity_type->getLabel(),
          '#open' => FALSE,
        ];

        $entity_notification_config = $notification_config->get("entities.{$entity_type_id}") ?? [];

        $form['notifications']['entity_settings'][$entity_type_id]['override_enabled'] = [
          '#type' => 'checkbox',
          '#title' => $this->t('Override default settings for @entity_type', ['@entity_type' => $entity_type->getLabel()]),
          '#default_value' => !empty($entity_notification_config['override_enabled']),
        ];

        $form['notifications']['entity_settings'][$entity_type_id]['email_provider'] = [
          '#type' => 'select',
          '#title' => $this->t('Email Provider'),
          '#options' => ['' => $this->t('Use default')] + $email_options,
          '#default_value' => $entity_notification_config['email_provider'] ?? '',
          '#states' => [
            'visible' => [
              ':input[name="notifications[entity_settings][' . $entity_type_id . '][override_enabled]"]' => [
                'checked' => TRUE,
              ],
            ],
          ],
        ];

        $form['notifications']['entity_settings'][$entity_type_id]['email_template'] = [
          '#type' => 'select',
          '#title' => $this->t('Email Template'),
          '#options' => ['' => $this->t('Use default')] + $email_template_options,
          '#default_value' => $entity_notification_config['email_template'] ?? '',
          '#states' => [
            'visible' => [
              ':input[name="notifications[entity_settings][' . $entity_type_id . '][override_enabled]"]' => [
                'checked' => TRUE,
              ],
            ],
          ],
        ];

        $form['notifications']['entity_settings'][$entity_type_id]['sms_provider'] = [
          '#type' => 'select',
          '#title' => $this->t('SMS Provider'),
          '#options' => ['' => $this->t('Use default')] + $sms_options,
          '#default_value' => $entity_notification_config['sms_provider'] ?? '',
          '#states' => [
            'visible' => [
              ':input[name="notifications[entity_settings][' . $entity_type_id . '][override_enabled]"]' => [
                'checked' => TRUE,
              ],
            ],
          ],
        ];

        $form['notifications']['entity_settings'][$entity_type_id]['sms_template'] = [
          '#type' => 'select',
          '#title' => $this->t('SMS Template'),
          '#options' => ['' => $this->t('Use default')] + $sms_template_options,
          '#default_value' => $entity_notification_config['sms_template'] ?? '',
          '#states' => [
            'visible' => [
              ':input[name="notifications[entity_settings][' . $entity_type_id . '][override_enabled]"]' => [
                'checked' => TRUE,
              ],
            ],
          ],
        ];
      }
    }
    else {
      $form['notifications']['entity_settings']['info'] = [
        '#markup' => '<p><em>' . $this->t('Enable entity tracking above to configure entity-specific notification settings.') . '</em></p>',
      ];
    }

    // Add link to advanced provider configuration.
    $form['notifications']['advanced'] = [
      '#type' => 'details',
      '#title' => $this->t('Advanced Configuration'),
      '#open' => FALSE,
    ];

    $form['notifications']['advanced']['links'] = [
      '#theme' => 'item_list',
      '#title' => $this->t('Advanced Settings'),
      '#items' => [
        [
          '#markup' => '<a href="/admin/config/system/status-manager/notifications/providers">' .
          $this->t('Configure Notification Providers') . '</a> - ' .
          $this->t('Set up API keys, credentials, and test providers'),
        ],
        [
          '#markup' => '<a href="/admin/config/system/status-manager/notifications/email-templates">' .
          $this->t('Manage Email Templates') . '</a> - ' .
          $this->t('Create and edit email notification templates'),
        ],
        [
          '#markup' => '<a href="/admin/config/system/status-manager/notifications/sms-templates">' .
          $this->t('Manage SMS Templates') . '</a> - ' .
          $this->t('Create and edit SMS notification templates'),
        ],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);

    $values = $form_state->getValues();

    // Validate cleanup days.
    if ($values['general']['cleanup_enabled'] && $values['general']['cleanup_days'] < 1) {
      $form_state->setErrorByName('general][cleanup_days', $this->t('Cleanup days must be at least 1.'));
    }

    // Validate notification settings - check both basic and advanced settings.
    if (isset($values['notifications'])) {
      if ($this->moduleHandler->moduleExists('status_manager_notifications') && $this->providerManager) {
        // Advanced validation for notifications module.
        if (!empty($values['notifications']['email']['enabled'])) {
          if (empty($values['notifications']['email']['provider'])) {
            $form_state->setErrorByName('notifications][email][provider', $this->t('Email provider is required when email notifications are enabled.'));
          }
        }

        if (!empty($values['notifications']['sms']['enabled'])) {
          if (empty($values['notifications']['sms']['provider'])) {
            $form_state->setErrorByName('notifications][sms][provider', $this->t('SMS provider is required when SMS notifications are enabled.'));
          }
        }
      }
      else {
        // Basic validation for email address.
        if ($values['notifications']['email_enabled'] && !empty($values['notifications']['email_from'])) {
          if (!filter_var($values['notifications']['email_from'], FILTER_VALIDATE_EMAIL)) {
            $form_state->setErrorByName('notifications][email_from', $this->t('Please enter a valid email address.'));
          }
        }
      }
    }

    // Validate custom date format.
    if ($values['display']['date_format'] === 'custom') {
      $custom_format = $values['display']['custom_date_format'];
      if (empty($custom_format)) {
        $form_state->setErrorByName('display][custom_date_format', $this->t('Custom date format is required when custom format is selected.'));
      }
      else {
        // Test the format.
        $test_date = date($custom_format);
        if ($test_date === FALSE) {
          $form_state->setErrorByName('display][custom_date_format', $this->t('Invalid date format.'));
        }
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $values = $form_state->getValues();

    // Save main status manager settings.
    $this->config('status_manager.settings')
      ->set('general', $values['general'])
      ->set('entity_mappings', $values['entity_mappings'])
      ->set('notifications', $values['notifications'])
      ->set('display', $values['display'])
      ->set('performance', $values['performance'])
      ->save();

    if ($this->moduleHandler->moduleExists('status_manager_notifications') && $this->providerManager && isset($values['notifications'])) {
      $notification_config = $this->configFactory->getEditable('status_manager_notifications.settings');

      // Save provider selections.
      if (isset($values['notifications']['email']['provider'])) {
        $notification_config->set('email.active_provider', $values['notifications']['email']['provider']);
      }
      if (isset($values['notifications']['sms']['provider'])) {
        $notification_config->set('sms.active_provider', $values['notifications']['sms']['provider']);
      }

      // Save template selections.
      if (isset($values['notifications']['email']['default_template'])) {
        $notification_config->set('email.default_template', $values['notifications']['email']['default_template']);
      }
      if (isset($values['notifications']['sms']['default_template'])) {
        $notification_config->set('sms.default_template', $values['notifications']['sms']['default_template']);
      }

      // Save entity-specific settings.
      if (isset($values['notifications']['entity_settings'])) {
        foreach ($values['notifications']['entity_settings'] as $entity_type_id => $entity_settings) {
          if (!empty($entity_settings['override_enabled'])) {
            $notification_config->set("entities.{$entity_type_id}", $entity_settings);
          }
          else {
            $notification_config->clear("entities.{$entity_type_id}");
          }
        }
      }

      $notification_config->save();
    }

    parent::submitForm($form, $form_state);
  }

  /**
   * Gets content entity types that can be tracked.
   *
   * @return \Drupal\Core\Entity\EntityTypeInterface[]
   *   Array of content entity types.
   */
  protected function getContentEntityTypes() {
    $entity_types = [];

    foreach ($this->entityTypeManager->getDefinitions() as $entity_type_id => $entity_type) {
      // Only include content entities that have fields.
      if ($entity_type->entityClassImplements('\Drupal\Core\Entity\ContentEntityInterface')) {
        $entity_types[$entity_type_id] = $entity_type;
      }
    }

    return $entity_types;
  }

  /**
   * Gets fields that could contain status information.
   *
   * @param string $entity_type_id
   *   The entity type ID.
   *
   * @return array
   *   Array of field options.
   */
  protected function getStatusFields($entity_type_id) {
    $fields = [];

    try {
      $field_definitions = $this->entityFieldManager->getBaseFieldDefinitions($entity_type_id);

      foreach ($field_definitions as $field_name => $field_definition) {
        $field_type = $field_definition->getType();

        // Include fields that commonly contain status information.
        if (in_array($field_type, ['list_string', 'string', 'boolean', 'entity_reference'])) {
          $fields[$field_name] = $field_definition->getLabel() . ' (' . $field_name . ')';
        }
      }

      // Also get configurable fields from bundles if they exist.
      $entity_type = $this->entityTypeManager->getDefinition($entity_type_id);

      // Check if this entity type has bundles.
      if ($entity_type->hasKey('bundle')) {
        $bundle_entity_type = $entity_type->getBundleEntityType();

        if ($bundle_entity_type) {
          try {
            $bundles = $this->entityTypeManager->getStorage($bundle_entity_type)->loadMultiple();

            foreach ($bundles as $bundle) {
              $bundle_fields = $this->entityFieldManager->getFieldDefinitions($entity_type_id, $bundle->id());

              foreach ($bundle_fields as $field_name => $field_definition) {
                if (!isset($fields[$field_name])) {
                  $field_type = $field_definition->getType();

                  if (in_array($field_type, ['list_string', 'string', 'boolean', 'entity_reference'])) {
                    $fields[$field_name] = $field_definition->getLabel() . ' (' . $field_name . ')';
                  }
                }
              }
            }
          }
          catch (\Exception $e) {
            // Bundle entity type doesn't exist or can't be loaded.
          }
        }
      }
    }
    catch (\Exception $e) {
      // If we can't get field definitions, return empty array.
    }

    return $fields;
  }

}
