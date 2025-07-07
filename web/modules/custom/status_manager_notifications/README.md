# Status Manager Notifications Module

A plugin-based notification system for the Status Manager module that provides extensible email and SMS notification capabilities.

## Features

- **Plugin-based Architecture**: Easy to extend with custom notification providers
- **Built-in Providers**: 
  - Email: Default (Drupal mail), SendGrid
  - SMS: Twilio, Africa's Talking
- **Template Management**: Create and manage notification templates with token support
- **Custom Messaging**: Send ad-hoc notifications outside of status changes
- **Token Integration**: Full support for Drupal's token system in templates

## Installation

1. Enable the module and its dependencies:
   ```bash
   drush en status_manager_notifications -y
   ```

2. Configure providers at `/admin/config/system/status-manager/notifications`

## Configuration

### Setting Up Providers

1. Navigate to **Configuration > System > Status Manager > Notifications**
2. Select your active providers for email and SMS
3. Configure each provider with required credentials

### Managing Templates

Templates can be managed through configuration or programmatically:

```php
// Get the template service
$email_template_service = \Drupal::service('status_manager_notifications.email_template_service');
$sms_template_service = \Drupal::service('status_manager_notifications.sms_template_service');

// Save an email template
$email_template_service->saveTemplate('node.published', 
  'Your article "[node:title]" has been published',
  'Hello [node:author:display-name],\n\nYour article has been published.\n\nView it here: [node:url]'
);

// Save an SMS template
$sms_template_service->saveTemplate('application.approved',
  'Your application [application:id] has been approved! Check your email for details.'
);
```

### Template Hierarchy

Templates are resolved in the following order (most specific to least):
1. `entity_type.bundle.field.status`
2. `entity_type.field.status`
3. `entity_type.status`
4. `field.status`
5. `status`
6. `default`

## Usage

### Automatic Notifications

When integrated with Status Manager, notifications are sent automatically on status changes:

```php
// In status_manager configuration
$status_tracker->logStatusChange(
  $entity,
  'status',
  'draft',
  'published',
  'user',
  'both', // Send both email and SMS
  'Published by editor'
);
```

### Sending Custom Messages

```php
$notification_manager = \Drupal::service('status_manager_notifications.notification_manager');

// Send custom email
$result = $notification_manager->sendCustomMessage(
  'email',
  'user@example.com',
  'Your custom message here',
  ['subject' => 'Custom Subject']
);

// Send custom SMS
$result = $notification_manager->sendCustomMessage(
  'sms',
  '+254700000000',
  'Your SMS message here'
);
```

## Creating Custom Providers

### 1. Create the Plugin Class

Create a new provider in your module at `src/Plugin/NotificationProvider/[Type]/MyCustomProvider.php`:

```php
<?php

namespace Drupal\my_module\Plugin\NotificationProvider\Email;

use Drupal\status_manager_notifications\Plugin\EmailProviderBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Provides a custom email notification provider.
 *
 * @NotificationProvider(
 *   id = "my_custom_email",
 *   label = @Translation("My Custom Email Provider"),
 *   description = @Translation("Sends emails via my custom service"),
 *   type = "email",
 *   weight = 10
 * )
 */
class MyCustomProvider extends EmailProviderBase {

  /**
   * {@inheritdoc}
   */
  public function isConfigured() {
    $config = $this->getConfiguration();
    return !empty($config['api_key']) && !empty($config['from_email']);
  }

  /**
   * {@inheritdoc}
   */
  public function sendEmail($to, $subject, $body, array $options = []) {
    $config = $this->getConfiguration();
    
    try {
      // Your custom email sending logic here
      $client = new MyEmailClient($config['api_key']);
      $result = $client->send([
        'to' => $to,
        'from' => $config['from_email'],
        'subject' => $subject,
        'body' => $body,
      ]);
      
      return [
        'success' => TRUE,
        'message' => 'Email sent successfully',
        'message_id' => $result->id,
      ];
    }
    catch (\Exception $e) {
      return [
        'success' => FALSE,
        'message' => $e->getMessage(),
      ];
    }
  }

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state) {
    $form = parent::buildConfigurationForm($form, $form_state);
    $config = $this->getConfiguration();

    $form['api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('API Key'),
      '#default_value' => $config['api_key'] ?? '',
      '#required' => TRUE,
    ];

    $form['from_email'] = [
      '#type' => 'email',
      '#title' => $this->t('From Email'),
      '#default_value' => $config['from_email'] ?? '',
      '#required' => TRUE,
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function getHelpText() {
    return $this->t('Configure your custom email provider settings.');
  }
}
```

### 2. Create an SMS Provider

```php
<?php

namespace Drupal\my_module\Plugin\NotificationProvider\Sms;

use Drupal\status_manager_notifications\Plugin\SmsProviderBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Provides a custom SMS notification provider.
 *
 * @NotificationProvider(
 *   id = "my_custom_sms",
 *   label = @Translation("My Custom SMS Provider"),
 *   description = @Translation("Sends SMS via my custom service"),
 *   type = "sms",
 *   weight = 10
 * )
 */
class MyCustomSmsProvider extends SmsProviderBase {

  /**
   * {@inheritdoc}
   */
  public function isConfigured() {
    $config = $this->getConfiguration();
    return !empty($config['api_key']) && !empty($config['sender_id']);
  }

  /**
   * {@inheritdoc}
   */
  public function sendSms($to, $message, array $options = []) {
    $config = $this->getConfiguration();
    
    // Normalize phone number
    $to = $this->normalizePhoneNumber($to);
    
    // Truncate message if needed
    if ($config['truncate_messages']) {
      $message = $this->truncateMessage($message);
    }
    
    try {
      // Your custom SMS sending logic
      $client = new MySmsClient($config['api_key']);
      $result = $client->send([
        'to' => $to,
        'from' => $config['sender_id'],
        'message' => $message,
      ]);
      
      return [
        'success' => TRUE,
        'message' => 'SMS sent successfully',
        'message_id' => $result->id,
      ];
    }
    catch (\Exception $e) {
      return [
        'success' => FALSE,
        'message' => $e->getMessage(),
      ];
    }
  }

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state) {
    $form = parent::buildConfigurationForm($form, $form_state);
    $config = $this->getConfiguration();

    $form['api_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('API Key'),
      '#default_value' => $config['api_key'] ?? '',
      '#required' => TRUE,
    ];

    $form['sender_id'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Sender ID'),
      '#default_value' => $config['sender_id'] ?? '',
      '#required' => TRUE,
    ];

    $form['truncate_messages'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Truncate long messages'),
      '#default_value' => $config['truncate_messages'] ?? TRUE,
    ];

    return $form;
  }
}
```

### 3. Clear Cache

After creating your provider:
```bash
drush cr
```

Your provider will now appear in the provider selection dropdown.

## Available Tokens

The module provides these tokens for use in templates:

- `[status_change:*]` - Status change entity tokens
- `[entity_type:*]` - Target entity tokens (e.g., `[node:*]`, `[application:*]`)
- `[site:*]` - Site information tokens
- `[current-user:*]` - Current user tokens

### Custom Status Change Tokens

- `[status_change:old_status]` - Previous status value
- `[status_change:new_status]` - New status value
- `[status_change:field_label]` - Human-readable field label
- `[status_change:old_status_label]` - Human-readable old status
- `[status_change:new_status_label]` - Human-readable new status
- `[status_change:created]` - When the change was made
- `[status_change:notes]` - Any notes about the change

## API

### Services

- `status_manager_notifications.notification_manager` - Main notification manager
- `status_manager_notifications.email_template_service` - Email template management
- `status_manager_notifications.sms_template_service` - SMS template management
- `status_manager_notifications.token_service` - Token replacement service

### Hooks

```php
/**
 * Alter notification provider definitions.
 */
function hook_status_manager_notification_provider_info_alter(&$definitions) {
  // Change provider weight
  if (isset($definitions['sendgrid_email'])) {
    $definitions['sendgrid_email']['weight'] = -10;
  }
}
```

## Troubleshooting

### Notifications Not Sending

1. Check that providers are configured correctly
2. Verify that the notification type is enabled in Status Manager settings
3. Check logs at `/admin/reports/dblog` for errors

### Templates Not Found

1. Ensure template keys follow the naming convention
2. Check that a default template exists as fallback
3. Clear cache after adding new templates

### Provider Not Appearing

1. Ensure your plugin annotation is correct
2. Clear all caches: `drush cr`
3. Check that your module is enabled
