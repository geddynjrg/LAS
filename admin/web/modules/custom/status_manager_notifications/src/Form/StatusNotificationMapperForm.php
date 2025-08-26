<?php

namespace Drupal\status_manager_notifications\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\TypedConfigManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Entity\EntityFieldManagerInterface;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\RedirectCommand;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Configure status-based notification mapping.
 */
class StatusNotificationMapperForm extends ConfigFormBase {

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
   * The request stack.
   *
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  protected $requestStack;

  /**
   * Constructs a StatusRoutingForm object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Config\TypedConfigManagerInterface $typed_config_manager
   *   The typed config manager.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Entity\EntityFieldManagerInterface $entity_field_manager
   *   The entity field manager.
   * @param \Symfony\Component\HttpFoundation\RequestStack $request_stack
   *   The request stack.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    TypedConfigManagerInterface $typed_config_manager,
    EntityTypeManagerInterface $entity_type_manager,
    EntityFieldManagerInterface $entity_field_manager,
    RequestStack $request_stack,
  ) {
    parent::__construct($config_factory, $typed_config_manager);
    $this->entityTypeManager = $entity_type_manager;
    $this->entityFieldManager = $entity_field_manager;
    $this->requestStack = $request_stack;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('config.factory'),
      $container->get('config.typed'),
      $container->get('entity_type.manager'),
      $container->get('entity_field.manager'),
      $container->get('request_stack')
    );
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['status_manager_notifications.status_notification_mapper'];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'status_manager_notifications_status_notification_mapper';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('status_manager_notifications.status_notification_mapper');

    $form['#tree'] = TRUE;
    $form['#prefix'] = '<div id="status-notification-mapper-form-wrapper">';
    $form['#suffix'] = '</div>';

    // Check if this is being displayed in a modal.
    $request = $this->requestStack->getCurrentRequest();
    $is_modal = $request->query->get('_wrapper_format') === 'drupal_modal' ||
                $request->attributes->get('_route') === 'status_manager_notifications.status_notification_mapper' &&
                $request->isXmlHttpRequest();

    $form['description'] = [
      '#markup' => '<p>' . $this->t('Configure which statuses send notifications to customers, admin users, or both. You can also specify which admin roles should receive notifications for each status.') . '</p>',
    ];

    // Get all available roles.
    $roles = $this->entityTypeManager->getStorage('user_role')->loadMultiple();
    $role_options = [];
    foreach ($roles as $role_id => $role) {
      if (!in_array($role_id, ['anonymous', 'authenticated'])) {
        $role_options[$role_id] = $role->label();
      }
    }

    // Get entity mappings from Status Manager configuration.
    $status_manager_config = $this->config('status_manager.settings');
    $entity_mappings = $status_manager_config->get('entity_mappings') ?? [];

    $form['mapping'] = [
      '#type' => 'vertical_tabs',
      '#title' => $this->t('Status Notification Mapping Configuration'),
    ];

    // Get enabled entities from Status Manager.
    $enabled_entities = [];
    foreach ($entity_mappings as $entity_type_id => $mapping) {
      if (!empty($mapping['enabled']) && !empty($mapping['tracked_fields'])) {
        $enabled_entities[$entity_type_id] = array_filter($mapping['tracked_fields']);
      }
    }

    if (empty($enabled_entities)) {
      $form['no_entities'] = [
        '#markup' => '<div class="messages messages--warning">' .
        $this->t('No entities are configured for status tracking. Please configure entity tracking in the <a href="@url">Status Manager settings</a> first.',
            ['@url' => '/admin/config/system/status-manager']) .
        '</div>',
      ];
      return parent::buildForm($form, $form_state);
    }

    foreach ($enabled_entities as $entity_type_id => $tracked_fields) {
      try {
        $entity_type = $this->entityTypeManager->getDefinition($entity_type_id);
        $form[$entity_type_id] = [
          '#type' => 'details',
          '#title' => $entity_type->getLabel() . ' (' . $entity_type_id . ')',
          '#group' => 'mapping',
        ];

        // Get field values dynamically for tracked fields.
        $status_values = $this->getFieldValues($entity_type_id, $tracked_fields);

        if (empty($status_values)) {
          $form[$entity_type_id]['no_fields'] = [
            '#markup' => '<p>' . $this->t('No status values found for tracked fields.') . '</p>',
          ];
          continue;
        }
      }
      catch (\Exception $e) {
        continue;
      }

      foreach ($status_values as $field_name => $field_data) {
        $form[$entity_type_id][$field_name] = [
          '#type' => 'fieldset',
          '#title' => $field_data['label'],
          '#description' => $this->t('Configure notifications for the "@field" field.', ['@field' => $field_name]),
        ];

        foreach ($field_data['values'] as $status_key => $status_label) {
          $mapping_key = "{$entity_type_id}.{$field_name}.{$status_key}";
          $mapping_config = $config->get($mapping_key) ?: [];

          $form[$entity_type_id][$field_name][$status_key] = [
            '#type' => 'fieldset',
            '#title' => $status_label,
            '#collapsible' => TRUE,
            '#collapsed' => empty($mapping_config),
          ];

          $form[$entity_type_id][$field_name][$status_key]['enabled'] = [
            '#type' => 'checkbox',
            '#title' => $this->t('Enable custom mapping for @status', ['@status' => $status_label]),
            '#default_value' => !empty($mapping_config),
          ];

          $form[$entity_type_id][$field_name][$status_key]['send_to_customer'] = [
            '#type' => 'checkbox',
            '#title' => $this->t('Send notification to customer'),
            '#default_value' => $mapping_config['send_to_customer'] ?? FALSE,
            '#states' => [
              'visible' => [
                ":input[name=\"{$entity_type_id}[{$field_name}][{$status_key}][enabled]\"]" => ['checked' => TRUE],
              ],
            ],
          ];

          $form[$entity_type_id][$field_name][$status_key]['customer_notification_types'] = [
            '#type' => 'checkboxes',
            '#title' => $this->t('Customer notification types'),
            '#options' => [
              'email' => $this->t('Email'),
              'sms' => $this->t('SMS'),
            ],
            '#default_value' => $mapping_config['customer_notification_types'] ?? ['email'],
            '#states' => [
              'visible' => [
                ":input[name=\"{$entity_type_id}[{$field_name}][{$status_key}][enabled]\"]" => ['checked' => TRUE],
                ":input[name=\"{$entity_type_id}[{$field_name}][{$status_key}][send_to_customer]\"]" => ['checked' => TRUE],
              ],
            ],
          ];

          $form[$entity_type_id][$field_name][$status_key]['send_to_admin'] = [
            '#type' => 'checkbox',
            '#title' => $this->t('Send notification to admin users'),
            '#default_value' => $mapping_config['send_to_admin'] ?? FALSE,
            '#states' => [
              'visible' => [
                ":input[name=\"{$entity_type_id}[{$field_name}][{$status_key}][enabled]\"]" => ['checked' => TRUE],
              ],
            ],
          ];

          $form[$entity_type_id][$field_name][$status_key]['admin_roles'] = [
            '#type' => 'checkboxes',
            '#title' => $this->t('Admin roles to notify'),
            '#options' => $role_options,
            '#default_value' => $mapping_config['admin_roles'] ?? ['administrator'],
            '#states' => [
              'visible' => [
                ":input[name=\"{$entity_type_id}[{$field_name}][{$status_key}][enabled]\"]" => ['checked' => TRUE],
                ":input[name=\"{$entity_type_id}[{$field_name}][{$status_key}][send_to_admin]\"]" => ['checked' => TRUE],
              ],
            ],
            '#description' => $this->t('Select which roles should receive admin notifications for this status.'),
          ];

          $form[$entity_type_id][$field_name][$status_key]['admin_notification_types'] = [
            '#type' => 'checkboxes',
            '#title' => $this->t('Admin notification types'),
            '#options' => [
              'email' => $this->t('Email'),
              'sms' => $this->t('SMS'),
            ],
            '#default_value' => $mapping_config['admin_notification_types'] ?? ['email'],
            '#states' => [
              'visible' => [
                ":input[name=\"{$entity_type_id}[{$field_name}][{$status_key}][enabled]\"]" => ['checked' => TRUE],
                ":input[name=\"{$entity_type_id}[{$field_name}][{$status_key}][send_to_admin]\"]" => ['checked' => TRUE],
              ],
            ],
          ];
        }
      }
    }

    // Custom mapping section.
    $form['custom'] = [
      '#type' => 'details',
      '#title' => $this->t('Custom Status Notification Mapping'),
      '#group' => 'mapping',
      '#description' => $this->t('Add custom mapping rules for specific entity types, fields, and status values.'),
    ];

    // Get existing custom mappings.
    $all_config = $config->getRawData();
    $custom_mappings = [];
    foreach ($all_config as $key => $value) {
      if (is_array($value) && !isset($form[$key])) {
        $custom_mappings[$key] = $value;
      }
    }

    $form['custom']['existing'] = [
      '#type' => 'table',
      '#header' => [
        $this->t('Mapping Key'),
        $this->t('Customer'),
        $this->t('Admin'),
        $this->t('Admin Roles'),
        $this->t('Operations'),
      ],
      '#empty' => $this->t('No custom mappings configured.'),
    ];

    foreach ($custom_mappings as $key => $mapping) {
      $form['custom']['existing'][$key]['key'] = [
        '#markup' => $key,
      ];
      $form['custom']['existing'][$key]['customer'] = [
        '#markup' => !empty($mapping['send_to_customer']) ? $this->t('Yes') : $this->t('No'),
      ];
      $form['custom']['existing'][$key]['admin'] = [
        '#markup' => !empty($mapping['send_to_admin']) ? $this->t('Yes') : $this->t('No'),
      ];
      $form['custom']['existing'][$key]['roles'] = [
        '#markup' => !empty($mapping['admin_roles']) ? implode(', ', $mapping['admin_roles']) : '-',
      ];
      $form['custom']['existing'][$key]['operations'] = [
        '#markup' => $this->t('Edit | Delete'),
      ];
    }

    $form['custom']['add_custom'] = [
      '#type' => 'fieldset',
      '#title' => $this->t('Add Custom Route'),
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
    ];

    $form['custom']['add_custom']['custom_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Mapping Key'),
      '#description' => $this->t('Format: entity_type.field.status (e.g., application.status.unassigned)'),
    ];

    $form['custom']['add_custom']['custom_send_to_customer'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Send to customer'),
    ];

    $form['custom']['add_custom']['custom_send_to_admin'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Send to admin'),
    ];

    $form['custom']['add_custom']['custom_admin_roles'] = [
      '#type' => 'checkboxes',
      '#title' => $this->t('Admin roles'),
      '#options' => $role_options,
      '#states' => [
        'visible' => [
          ':input[name="custom[add_custom][custom_send_to_admin]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    // Build form actions.
    $form = parent::buildForm($form, $form_state);

    if ($is_modal) {
      // Always add AJAX to handle modal submissions properly.
      $form['actions']['submit']['#ajax'] = [
        'callback' => '::ajaxSubmit',
        'wrapper' => 'status-notification-mapper-form-wrapper',
        'effect' => 'fade',
        'progress' => [
          'type' => 'throbber',
          'message' => $this->t('Saving configuration...'),
        ],
      ];

      // Add cancel button for modal.
      $form['actions']['cancel'] = [
        '#type' => 'link',
        '#title' => $this->t('Cancel'),
        '#url' => Url::fromRoute('<current>'),
        '#attributes' => [
          'class' => ['button', 'dialog-cancel'],
        ],
        '#weight' => 100,
      ];
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $config = $this->config('status_manager_notifications.status_notification_mapper');
    $values = $form_state->getValues();

    // Clear all existing configuration.
    foreach ($config->getRawData() as $key => $value) {
      $config->clear($key);
    }

    // Get enabled entities from Status Manager configuration.
    $status_manager_config = $this->config('status_manager.settings');
    $entity_mappings = $status_manager_config->get('entity_mappings') ?? [];

    $enabled_entities = [];
    foreach ($entity_mappings as $entity_type_id => $mapping) {
      if (!empty($mapping['enabled'])) {
        $enabled_entities[] = $entity_type_id;
      }
    }

    // Process entity type configurations.
    foreach ($enabled_entities as $entity_type_id) {
      if (isset($values[$entity_type_id])) {
        foreach ($values[$entity_type_id] as $field_name => $field_config) {
          if (is_array($field_config)) {
            foreach ($field_config as $status_key => $status_config) {
              if (is_array($status_config) && !empty($status_config['enabled'])) {
                $mapping_key = "{$entity_type_id}.{$field_name}.{$status_key}";

                // Clean up the configuration.
                $clean_config = [
                  'send_to_customer' => !empty($status_config['send_to_customer']),
                  'send_to_admin' => !empty($status_config['send_to_admin']),
                ];

                // Process customer notification types.
                if ($clean_config['send_to_customer'] && !empty($status_config['customer_notification_types'])) {
                  $clean_config['customer_notification_types'] = array_values(array_filter($status_config['customer_notification_types']));
                }

                // Process admin roles and notification types.
                if ($clean_config['send_to_admin']) {
                  if (!empty($status_config['admin_roles'])) {
                    $clean_config['admin_roles'] = array_values(array_filter($status_config['admin_roles']));
                  }
                  if (!empty($status_config['admin_notification_types'])) {
                    $clean_config['admin_notification_types'] = array_values(array_filter($status_config['admin_notification_types']));
                  }
                }

                $config->set($mapping_key, $clean_config);
              }
            }
          }
        }
      }
    }

    // Process custom configuration if provided.
    if (!empty($values['custom']['add_custom']['custom_key'])) {
      $custom_key = $values['custom']['add_custom']['custom_key'];
      $custom_config = [
        'send_to_customer' => !empty($values['custom']['add_custom']['custom_send_to_customer']),
        'send_to_admin' => !empty($values['custom']['add_custom']['custom_send_to_admin']),
      ];

      if ($custom_config['send_to_admin'] && !empty($values['custom']['add_custom']['custom_admin_roles'])) {
        $custom_config['admin_roles'] = array_values(array_filter($values['custom']['add_custom']['custom_admin_roles']));
        $custom_config['admin_notification_types'] = ['email'];
      }

      if ($custom_config['send_to_customer']) {
        $custom_config['customer_notification_types'] = ['email'];
      }

      $config->set($custom_key, $custom_config);
    }

    $config->save();
    // Always call parent submitForm to handle standard config form behavior.
    parent::submitForm($form, $form_state);
  }

  /**
   * AJAX callback for form submission.
   *
   * @param array $form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse|array
   *   The AJAX response or form array.
   */
  public function ajaxSubmit(array &$form, FormStateInterface $form_state) {
    // Check if there are any errors.
    if ($form_state->hasAnyErrors()) {
      // Return the form with errors.
      return $form;
    }
    // Modal submission - close and redirect.
    $response = new AjaxResponse();
    $response->addCommand(new CloseModalDialogCommand());
    $settings_url = Url::fromRoute('status_manager.settings', [], [])->toString();
    $response->addCommand(new RedirectCommand($settings_url));

    return $response;
  }

  /**
   * Gets field values dynamically from entity field definitions.
   *
   * @param string $entity_type_id
   *   The entity type ID.
   * @param array $field_names
   *   Array of field names to get values for.
   *
   * @return array
   *   Array of field data with values.
   */
  protected function getFieldValues($entity_type_id, array $field_names) {
    $field_values = [];

    foreach ($field_names as $field_name) {
      if (!$field_name) {
        continue;
      }

      try {
        // Get field definition.
        $field_definitions = $this->entityFieldManager->getFieldDefinitions($entity_type_id, $entity_type_id);

        if (!isset($field_definitions[$field_name])) {
          // Try to get from any bundle.
          $entity_type = $this->entityTypeManager->getDefinition($entity_type_id);
          if ($entity_type->hasKey('bundle')) {
            $bundle_entity_type = $entity_type->getBundleEntityType();
            if ($bundle_entity_type) {
              $bundles = $this->entityTypeManager->getStorage($bundle_entity_type)->loadMultiple();
              foreach ($bundles as $bundle) {
                $bundle_fields = $this->entityFieldManager->getFieldDefinitions($entity_type_id, $bundle->id());
                if (isset($bundle_fields[$field_name])) {
                  $field_definitions[$field_name] = $bundle_fields[$field_name];
                  break;
                }
              }
            }
          }
        }

        if (!isset($field_definitions[$field_name])) {
          continue;
        }

        $field_definition = $field_definitions[$field_name];
        $field_type = $field_definition->getType();
        $values = [];

        // Get values based on field type.
        if ($field_type === 'list_string' || $field_type === 'list_integer') {
          // Get allowed values from field settings.
          $field_settings = $field_definition->getSettings();
          if (!empty($field_settings['allowed_values'])) {
            $values = $field_settings['allowed_values'];
          }
        }
        elseif ($field_type === 'boolean') {
          // Boolean fields have two states.
          $values = [
            '0' => $this->t('Inactive'),
            '1' => $this->t('Active'),
          ];
        }
        elseif ($field_type === 'entity_reference' && $field_name === 'moderation_state') {
          // Special handling for moderation states.
          try {
            $states = $this->entityTypeManager->getStorage('workflow')->loadMultiple();
            foreach ($states as $workflow) {
              if ($workflow->getTypePlugin()) {
                $type_settings = $workflow->getTypePlugin()->getConfiguration();
                if (!empty($type_settings['states'])) {
                  foreach ($type_settings['states'] as $state_id => $state_info) {
                    $values[$state_id] = $state_info['label'] ?? $state_id;
                  }
                }
              }
            }
          }
          catch (\Exception $e) {
            // If we can't load workflows, skip this field.
          }
        }
        else {
          // For other field types, try to get distinct values from existing
          // entities.
          $values = $this->getDistinctFieldValues($entity_type_id, $field_name);
        }

        if (!empty($values)) {
          $field_values[$field_name] = [
            'label' => $field_definition->getLabel() . ' (' . $field_name . ')',
            'values' => $values,
          ];
        }
      }
      catch (\Exception $e) {
        // Skip fields that cause errors.
        continue;
      }
    }

    return $field_values;
  }

  /**
   * Gets distinct values from existing entities for a field.
   *
   * @param string $entity_type_id
   *   The entity type ID.
   * @param string $field_name
   *   The field name.
   *
   * @return array
   *   Array of distinct values.
   */
  protected function getDistinctFieldValues($entity_type_id, $field_name) {
    $values = [];

    try {
      $storage = $this->entityTypeManager->getStorage($entity_type_id);

      // Query for distinct values.
      $query = $storage->getQuery()
        ->accessCheck(FALSE)
        ->condition($field_name, NULL, 'IS NOT NULL')
        ->range(0, 50);

      $entity_ids = $query->execute();

      if (!empty($entity_ids)) {
        $entities = $storage->loadMultiple($entity_ids);
        foreach ($entities as $entity) {
          if ($entity->hasField($field_name) && !$entity->get($field_name)->isEmpty()) {
            $field_value = $entity->get($field_name)->value;
            if ($field_value !== NULL && $field_value !== '') {
              $values[$field_value] = $field_value;
            }
          }
        }
      }
    }
    catch (\Exception $e) {
      // Return empty array on error.
    }

    return $values;
  }

}
