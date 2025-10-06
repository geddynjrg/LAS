<?php

namespace Drupal\status_manager_notifications\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\TypedConfigManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Utility\Token;
use Drupal\user\RoleInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configure status notification settings.
 */
class NotificationSettingsForm extends ConfigFormBase {

  /**
   * The entity type manager.
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * The token service.
   */
  protected Token $token;

  /**
   * Constructs a NotificationSettingsForm object.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    TypedConfigManagerInterface $typed_config_manager,
    EntityTypeManagerInterface $entity_type_manager,
    Token $token,
  ) {
    parent::__construct($config_factory, $typed_config_manager);
    $this->entityTypeManager = $entity_type_manager;
    $this->token = $token;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('config.factory'),
      $container->get('config.typed'),
      $container->get('entity_type.manager'),
      $container->get('token')
    );
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['status_manager_notifications.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'status_manager_notifications_settings';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('status_manager_notifications.settings');
    $form['#tree'] = TRUE;
    $form['#attached']['library'][] = 'status_manager_notifications/notification_settings_form';
    $form['#attributes']['class'][] = 'notification-settings-form';

    // Global settings.
    $form['global'] = [
      '#type' => 'details',
      '#title' => $this->t('Global Settings'),
      '#open' => TRUE,
    ];

    $form['global']['prefer_sms'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Prefer SMS'),
      '#description' => $this->t('Try SMS first, fallback to email if no phone number is available or SMS fails.'),
      '#default_value' => $config->get('global.prefer_sms') ?? TRUE,
    ];

    $form['global']['from_email'] = [
      '#type' => 'email',
      '#title' => $this->t('From Email'),
      '#description' => $this->t('Default sender email address.'),
      '#default_value' => $config->get('global.from_email') ?? '',
      '#required' => TRUE,
    ];

    $form['global']['from_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('From Name'),
      '#description' => $this->t('Default sender name.'),
      '#default_value' => $config->get('global.from_name') ?? 'Uwezo',
      '#required' => TRUE,
    ];

    // Provider settings.
    $form['providers'] = [
      '#type' => 'details',
      '#title' => $this->t('Delivery Providers'),
      '#open' => FALSE,
      '#description' => $this->t('Configure email and SMS delivery settings.'),
    ];

    $this->buildProviderSettings($form, $config);

    // Status notifications.
    $form['status_notifications'] = [
      '#type' => 'details',
      '#title' => $this->t('Status Messages'),
      '#open' => TRUE,
      '#description' => $this->t('Configure messages sent when application status changes. Use tokens to personalize content.'),
    ];

    // Token help.
    if (\Drupal::moduleHandler()->moduleExists('token')) {
      $form['status_notifications']['token_help'] = [
        '#theme' => 'token_tree_link',
        '#token_types' => ['application', 'status_change', 'user'],
        '#global_types' => FALSE,
        '#weight' => -10,
      ];
    }

    $this->buildStatusNotificationSettings($form, $form_state, $config);

    return parent::buildForm($form, $form_state);
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
        'visible' => [':input[name="providers[email][enabled]"]' => ['checked' => TRUE]],
      ],
    ];

    $form['providers']['email']['from_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('From Name'),
      '#default_value' => $config->get('providers.email.from_name') ?? '',
      '#states' => [
        'visible' => [':input[name="providers[email][enabled]"]' => ['checked' => TRUE]],
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
        'visible' => [':input[name="providers[email_admin][enabled]"]' => ['checked' => TRUE]],
      ],
    ];

    $form['providers']['email_admin']['from_name'] = [
      '#type' => 'textfield',
      '#title' => $this->t('From Name'),
      '#default_value' => $config->get('providers.email_admin.from_name') ?? '',
      '#states' => [
        'visible' => [':input[name="providers[email_admin][enabled]"]' => ['checked' => TRUE]],
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
            ":input[name=\"status_notifications[{$status_id}][enabled]\"]" => ['checked' => TRUE],
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
            ":input[name=\"status_notifications[{$status_id}][enabled]\"]" => ['checked' => TRUE],
            ":input[name=\"status_notifications[{$status_id}][recipient]\"]" => ['value' => 'admin'],
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
            ":input[name=\"status_notifications[{$status_id}][enabled]\"]" => ['checked' => TRUE],
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
            ":input[name=\"status_notifications[{$status_id}][enabled]\"]" => ['checked' => TRUE],
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
            ":input[name=\"status_notifications[{$status_id}][enabled]\"]" => ['checked' => TRUE],
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
      \Drupal::logger('status_manager_notifications')->error('Failed to load application statuses: @error', [
        '@error' => $e->getMessage(),
      ]);
    }

    // Fallback statuses.
    return [
      'draft' => $this->t('Draft'),
      'submitted' => $this->t('Submitted'),
      'under_review' => $this->t('Under Review'),
      'approved' => $this->t('Approved'),
      'rejected' => $this->t('Rejected'),
    ];
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

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    parent::validateForm($form, $form_state);

    $values = $form_state->getValues();

    // Validate global settings.
    if (empty($values['global']['from_email'])) {
      $form_state->setErrorByName('global][from_email', $this->t('From email is required.'));
    }

    // Validate status messages.
    if (isset($values['status_notifications'])) {
      foreach ($values['status_notifications'] as $status_id => $status_config) {
        if (!empty($status_config['enabled'])) {
          if (empty($status_config['subject'])) {
            $form_state->setErrorByName("status_notifications][{$status_id}][subject",
              $this->t('Subject is required.'));
          }

          if (empty($status_config['email_message'])) {
            $form_state->setErrorByName("status_notifications][{$status_id}][email_message",
              $this->t('Email message is required.'));
          }

          if (empty($status_config['sms_message'])) {
            $form_state->setErrorByName("status_notifications][{$status_id}][sms_message",
              $this->t('SMS message is required.'));
          }

          if (!empty($status_config['sms_message']) && mb_strlen($status_config['sms_message']) > 320) {
            $form_state->setErrorByName("status_notifications][{$status_id}][sms_message",
              $this->t('SMS message should not exceed 320 characters (currently @count).', [
                '@count' => mb_strlen($status_config['sms_message']),
              ]));
          }

          if ($status_config['recipient'] === 'admin' && empty(array_filter($status_config['admin_roles']))) {
            $form_state->setErrorByName("status_notifications][{$status_id}][admin_roles",
              $this->t('Select at least one admin role.'));
          }
        }
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $config = $this->config('status_manager_notifications.settings');
    $values = $form_state->getValues();

    // Save global settings.
    $config->set('global', $values['global']);

    // Save provider settings.
    $config->set('providers', $values['providers']);

    // Save status notifications.
    if (isset($values['status_notifications'])) {
      foreach ($values['status_notifications'] as $status_id => $status_config) {
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

    parent::submitForm($form, $form_state);
  }

}
