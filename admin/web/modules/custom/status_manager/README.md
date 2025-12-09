# Status Manager (Simplified)

A Drupal module for tracking loan application status changes with complete audit trail.

## Overview

This module automatically tracks all status changes on loan application entities, creating a complete audit trail with timestamps, user attribution, and optional notes. **Simplified to track only application entities.**

## Features

- ✅ **Automatic Status Tracking**: Tracks every application status change automatically
- ✅ **Complete Audit Trail**: Immutable history of all status changes
- ✅ **User Attribution**: Records who made each change
- ✅ **Timestamp Tracking**: Exact time of each status change
- ✅ **Optional Notes**: Add context to status changes
- ✅ **Notification Integration**: Works with status_manager_notifications module for email/SMS alerts
- ✅ **Status History View**: See complete status change history for any application

## Installation

```bash
drush en status_manager
```

## Configuration

**Location**: `/admin/config/app-services/status-manager`

### Settings

```yaml
# config/sync/status_manager.settings.yml
general:
  auto_tracking_enabled: true   # Enable/disable tracking
  history_limit: 50              # Number of history items to display
  cleanup_enabled: true          # Auto-delete old records
  cleanup_days: 365              # Keep records for this many days

tracking:
  entity_type: application       # Hardcoded to application
  field: status                  # Hardcoded to status field
  create_audit_trail: true       # Log all status changes
```

## Usage

### Automatic Tracking

Status changes are tracked automatically when applications are updated:

```php
// This automatically triggers tracking
$application->setStatus('approved');
$application->save();
```

### Manual Status Change Logging

```php
$status_tracker = \Drupal::service('status_manager.status_tracker');

$status_tracker->logStatusChange(
  $application,         // Application entity
  'status',             // Field name (always 'status')
  'under_review',       // Old status
  'approved',           // New status
  'user',               // Source: 'user', 'system', 'api'
  'notification',       // Notification type
  'Approved by manager' // Optional notes
);
```

### Get Status History

```php
$status_tracker = \Drupal::service('status_manager.status_tracker');

// Get history for an application
$history = $status_tracker->getStatusHistory($application, 'status');

// Get history with limit
$recent_changes = $status_tracker->getStatusHistory($application, 'status', 10);
```

### View Status History

- **All changes**: `/admin/content/status-changes`
- **Specific application**: `/application/{id}/status-history`
- **Status Updates tab**: Available in main content admin area

## Integration with Notifications

When integrated with `status_manager_notifications` module:

1. Status change is logged
2. Notification config is checked for the new status
3. Notifications sent via SMS (preferred) or email
4. Notification results logged in status_change entity

See `status_manager_notifications` README for notification configuration.

## Permissions

- **View status changes**: See status change history
- **Administer status changes**: Full access to status tracking system

## Database

### status_change Entity

Fields:
- `target_entity_type`: Always 'application'
- `target_entity_id`: Application ID
- `status_field`: Always 'status'
- `old_status`: Previous status value
- `new_status`: New status value
- `source`: Who/what triggered the change
- `created`: Timestamp
- `uid`: User who made the change
- `notes`: Optional notes
- `notification_status`: 'none', 'sent', 'failed', 'partial'
- `notification_log`: Log of notification attempts

## API Example

```php
// Get all status changes for an application
$application_id = 123;
$status_changes = \Drupal::entityTypeManager()
  ->getStorage('status_change')
  ->loadByProperties([
    'target_entity_type' => 'application',
    'target_entity_id' => $application_id,
  ]);

// Get the most recent status change
$query = \Drupal::entityQuery('status_change')
  ->condition('target_entity_type', 'application')
  ->condition('target_entity_id', $application_id)
  ->sort('created', 'DESC')
  ->range(0, 1)
  ->accessCheck(FALSE);

$ids = $query->execute();
$latest_change = $ids ? \Drupal::entityTypeManager()
  ->getStorage('status_change')
  ->load(reset($ids)) : NULL;
```

## Troubleshooting

### Status changes not being tracked

1. Check `auto_tracking_enabled` is `true` in config
2. Verify the status field actually changed
3. Check Drupal logs for errors

### No status history showing

1. Verify user has "View status changes" permission
2. Check that status changes exist in database
3. Clear cache: `drush cr`

## Upgrade from Previous Version

This is a simplified version that removes:
- ❌ Multi-entity tracking (only applications now)
- ❌ Configurable field tracking (only status field)
- ❌ Tracking modes (always on for applications)
- ❌ Entity mapping configuration
- ❌ Fallback detection logic

**Migration**: Existing status_change entities are preserved. Configuration auto-migrates.

## Performance

- Tracking adds minimal overhead (~5-10ms per application save)
- Cleanup runs via cron to prevent database bloat
- History queries are optimized with indexes

## Requirements

- Drupal 9.0+ or Drupal 10.0+
- PHP 8.1+
- `api_application` module (provides Application entity)

## License

GPL-2.0-or-later
