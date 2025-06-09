# Status Manager Module

A comprehensive Drupal module for tracking status changes across any entity type with configurable notifications and detailed history tracking.

## Features

### 🎯 Flexible Tracking Modes
- **Configured Entities Only**: Track only entities you specifically configure
- **Automatic Detection**: Track common entity types with standard status fields automatically  
- **Both**: Use configured entities first, then fall back to automatic detection

### 🔧 Entity Configuration
- Configure any content entity type for status tracking
- Select specific fields to monitor for changes
- Set default notification types per entity type
- Support for base fields and configurable fields

### 📊 Comprehensive History
- Complete audit trail of all status changes
- Track old and new status values
- Record change source (user, system, API, etc.)
- Optional notes for each status change
- User information and timestamps

### 🔔 Notification System
- Email and SMS notification support
- Configurable notification types per entity
- Extensible notification system via plugins
- Notification status tracking and logging

### 🎨 Modern UI
- Beautiful, responsive admin interface
- Color-coded status badges
- Sortable and filterable tables
- Interactive form elements with real-time validation

## Installation

1. Place the module in your `modules/custom` directory
2. Enable the module: `drush en status_manager`
3. Configure settings at `/admin/config/system/status-manager`

## Configuration

### Tracking Modes

Navigate to **Configuration > System > Status Manager Settings** to configure tracking:

#### 1. Configured Entities Only
- Only tracks entities you specifically configure
- Provides full control over which fields are monitored
- Best for specific, controlled tracking scenarios

**To configure:**
1. Select "Configured Entities Only" tracking mode
2. Enable tracking for desired entity types in "Entity Type Mappings"
3. Select specific fields to track for each entity type
4. Set notification preferences

#### 2. Automatic Detection
- Automatically tracks common entity types with standard fields
- No configuration needed
- Tracks: `application`, `node`, `user` entities
- Monitors: `status`, `field_status`, `field_application_status`, `moderation_state` fields

#### 3. Both (Recommended)
- First checks your configured entities
- Falls back to automatic detection if no configuration found
- Best of both worlds approach

### Entity Type Mappings

When using "Configured Entities" or "Both" modes:

1. **Enable tracking** for each entity type you want to monitor
2. **Select fields** that contain status information
3. **Set notification type** (none, email, SMS, both)

The system automatically detects suitable fields including:
- List fields (select lists)
- String fields
- Boolean fields  
- Entity reference fields

### Notification Settings

Configure email and SMS notifications:
- **Email**: Set from address, enable/disable
- **SMS**: Choose provider (Twilio, Vonage, Custom)
- **Per-entity**: Override notification types per entity type

## Usage

### Programmatic API

```php
// Get the status tracker service
$status_tracker = \Drupal::service('status_manager.status_tracker');

// Log a status change manually
$status_tracker->logStatusChange(
  $entity,           // The entity being tracked
  'status',          // Field name containing status
  'draft',           // Old status value
  'published',       // New status value
  'user',            // Source of change
  'email',           // Notification type
  'Published by admin' // Optional notes
);

// Get status history for an entity
$history = $status_tracker->getStatusHistory($entity, 'status');

// Auto-track changes (usually called via hook)
$status_tracker->autoTrackStatusChanges(
  $entity,
  $entity->original,
  ['status', 'field_application_status'],
  'user',
  'both'
);
```

### Automatic Tracking

Status changes are automatically tracked when entities are updated if:

1. **Auto-tracking is enabled** in settings
2. **Entity type is configured** (for configured/both modes)
3. **Field values actually change** between old and new entity states

### Viewing History

Status change history is available:
- **Admin interface**: `/admin/content/status-changes`
- **Entity-specific**: `/admin/content/status-changes?entity_type=node&entity_id=123`
- **Programmatically**: Via the StatusTracker service

## Testing the Tracking Modes

### Test Configured Entities Mode

1. Go to **Configuration > System > Status Manager Settings**
2. Select **"Configured Entities Only"** tracking mode
3. Enable tracking for "Application" entity type
4. Select "status" field to track
5. Set notification type to "Email"
6. Save configuration
7. Create/edit an application and change its status
8. Check `/admin/content/status-changes` for the logged change

### Test Automatic Detection Mode

1. Select **"Automatic Detection"** tracking mode
2. Save configuration (no entity configuration needed)
3. Create/edit a node and change its published status
4. Or create/edit an application with a status field
5. Check status changes list for automatically tracked changes

### Test Both Mode

1. Select **"Both"** tracking mode
2. Configure some entity types manually
3. Leave others unconfigured
4. Test both configured and unconfigured entities
5. Verify configured entities use your settings
6. Verify unconfigured entities use automatic detection

## Extending the Module

### Custom Notification Providers

Create a custom notification service:

```php
namespace Drupal\my_module\Service;

use Drupal\status_manager\Service\NotificationInterface;

class CustomNotificationService implements NotificationInterface {
  
  public function sendNotification($status_change, $type, $recipients) {
    // Your custom notification logic
  }
  
  public function isConfigured() {
    return TRUE; // Return whether service is properly configured
  }
}
```

Register in `my_module.services.yml`:

```yaml
services:
  my_module.custom_notification:
    class: Drupal\my_module\Service\CustomNotificationService
    tags:
      - { name: status_manager.notification_provider }
```

### Custom Status Field Detection

Extend the StatusTracker service to detect custom field types:

```php
// In a custom module's .module file
function my_module_status_manager_field_types_alter(&$field_types) {
  $field_types[] = 'my_custom_field_type';
}
```

## Troubleshooting

### Status Changes Not Being Tracked

1. **Check auto-tracking is enabled** in settings
2. **Verify tracking mode** is appropriate for your entities
3. **Confirm entity type is configured** (for configured mode)
4. **Check field selection** includes the fields being changed
5. **Ensure field values actually change** (old ≠ new)

### Entity Mappings Section Not Visible

1. **Enable auto-tracking** checkbox must be checked
2. **Select "Configured Entities" or "Both"** tracking mode
3. **Clear cache** if form states aren't updating

### No Suitable Fields Found

This means the entity type has no fields that commonly contain status information. You can:
1. Add custom fields to the entity type
2. Use automatic detection mode for standard entities
3. Extend the field detection logic in a custom module

## Performance Considerations

- **History Limit**: Set reasonable limits for status history display
- **Cleanup**: Enable automatic cleanup of old records
- **Caching**: Enable caching for better performance
- **Batch Size**: Adjust batch processing size for bulk operations

## Security

- **Access Control**: Granular permissions for viewing/managing status changes
- **Field Protection**: Status changes are read-only after creation
- **User Tracking**: All changes are attributed to users
- **Audit Trail**: Complete history cannot be modified

## Requirements

- Drupal 9.0+ or Drupal 10.0+
- PHP 7.4+
- MySQL 5.7+ or PostgreSQL 10+

## License

GPL-2.0-or-later 