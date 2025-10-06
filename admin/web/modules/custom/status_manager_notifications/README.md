# Status Manager Notifications (Simplified)

Send email and SMS notifications when loan application statuses change. **Simplified for application entities only.**

## Overview

This module sends notifications (SMS preferred, email fallback) when application statuses change. Configure messages per status with token support.

## Features

- ✅ **Status-based Notifications**: Configure who gets notified for each status
- ✅ **SMS Preferred**: Try SMS first, fallback to email automatically
- ✅ **Token Support**: Personalize messages with application data
- ✅ **Role-based Recipients**: Send to customers or admins by role
- ✅ **Beautiful Email Templates**: Uses ApplicationEmailProvider for styled emails
- ✅ **Simple Configuration**: Single YAML config file

## Installation

```bash
drush en status_manager_notifications
```

## Configuration

**Location**: Edit `config/sync/status_manager_notifications.settings.yml`

```yaml
global:
  prefer_sms: true              # Try SMS first, fallback to email
  from_email: uwezo@adm.ee
  from_name: Uwezo

providers:
  email:
    # Uses hardcoded provider: api_application_email
    enabled: true
    from_email: uwezo@adm.ee
    from_name: Uwezo
    use_html: true

  email_admin:
    # Uses hardcoded provider: application_admin_email
    enabled: true
    from_email: admin@uwezo.com
    from_name: 'Uwezo Admin'
    use_html: true

  sms:
    # Uses system-wide SMS provider from sms_providers.settings
    enabled: false               # Enable when SMS is configured

status_notifications:
  unassigned:
    enabled: true
    recipient: admin             # 'customer' or 'admin'
    admin_roles: [reviewer]      # Required when recipient: admin
    subject: 'New Application Requires Review'
    message: |
      New application submitted:
      ID: [application:application_id]
      Group: [application:group_name]
      View: [application:url]

  approved:
    enabled: true
    recipient: customer
    subject: 'Loan Application Approved'
    message: |
      Congratulations! Your loan application [application:application_id] has been approved.
      Amount: [application:loan_amount]

  rejected:
    enabled: true
    recipient: customer
    subject: 'Application Update'
    message: |
      Application [application:application_id] status update.
      Reason: [application:rejection_reason]
      [application:rejection_message]
```

## Adding New Status Notifications

1. Add new status to `status_notifications` in config
2. Set `enabled: true`
3. Choose recipient type: `customer` or `admin`
4. If `admin`, specify roles: `admin_roles: [reviewer, manager]`
5. Write subject and message with tokens
6. Import config: `drush cim`

## Available Tokens

### Application Tokens
- `[application:application_id]`
- `[application:group_name]`
- `[application:loan_amount]`
- `[application:status]`
- `[application:rejection_reason]`
- `[application:rejection_message]`
- `[application:url]` - Link to view application
- `[application:created]`
- `[application:changed]`

### User Tokens (for application owner)
- `[application:owner:display-name]`
- `[application:owner:mail]`

### Status Change Tokens
- `[status_change:old-status]`
- `[status_change:new-status]`
- `[status_change:created]`

## How It Works

1. **Application Status Changes**
   ```php
   $application->setStatus('approved');
   $application->save();
   ```

2. **Status Manager Logs Change**
   - Creates status_change entity
   - Calls NotificationManager

3. **Notification Manager**
   - Gets config for 'approved' status
   - Resolves recipients (customer or admins)
   - Prepares message with tokens
   - Sends via SMS if phone available, else email
   - Logs results

## SMS Configuration

1. Configure your SMS provider system-wide at `/admin/config/sms-providers`
2. Select your default SMS provider (e.g., Africa's Talking)
3. Enable SMS notifications in status notifications:

```yaml
providers:
  sms:
    enabled: true
```

4. Ensure users have `field_phone_number` field populated

**Note**: The SMS provider is configured globally via the SMS Providers module. Notification settings only control whether to enable/disable SMS for status notifications.

## Email Templates

Email providers are hardcoded for consistency:

1. **api_application_email**: Automatically used for customer emails (beautiful template)
2. **application_admin_email**: Automatically used for admin notifications

Both use ApplicationEmailProvider with HTML styling. You can customize sender email/name in configuration, but the providers themselves are fixed.

## Recipient Resolution

### Customer Notifications
```yaml
recipient: customer
```
- Sends to application owner's email
- If `prefer_sms: true` and owner has phone → SMS first
- Else → email

### Admin Notifications
```yaml
recipient: admin
admin_roles: [reviewer, manager]
```
- Finds all active users with specified roles
- Sends notification to each matching user
- Respects SMS preference per user

## API Usage

```php
// Get notification manager
$manager = \Drupal::service('status_manager_notifications.notification_manager');

// Send notifications for a status change
$status_change = $status_tracker->logStatusChange(...);
$results = $manager->sendNotificationsViaPlugins($status_change);

// Check results
foreach ($results as $result) {
  if ($result['success']) {
    // Notification sent
  } else {
    // Failed: $result['message']
  }
}
```

## Troubleshooting

### Notifications Not Sending

1. **Check config**: `drush cget status_manager_notifications.settings`
2. **Verify status enabled**: Check `status_notifications.{status}.enabled`
3. **Check provider enabled**: Verify email/SMS provider enabled
4. **Test tokens**: Use Token module UI to test token replacement
5. **Check logs**: `drush wd-show` for errors

### SMS Not Working

1. **Provider enabled**: `providers.sms.enabled: true`
2. **Provider configured**: Check AfricasTalkingSmsProvider configuration
3. **Phone number exists**: User has `field_phone_number` populated
4. **Fallback works**: If SMS fails, should fallback to email

### Wrong Recipients

1. **Check recipient type**: `customer` vs `admin`
2. **Verify roles**: Ensure `admin_roles` includes correct roles
3. **Check user status**: Only active users receive notifications

## Performance

- Lazy loading of providers (only instantiated when needed)
- Cached provider instances within request
- Minimal overhead per notification (~10-20ms)

## Requirements

- status_manager module
- api_application module (provides Application entity and email providers)
- Token module (core)
- For SMS: Africa's Talking API account

## Upgrade from Previous Version

Removed features:
- ❌ Generic entity support (applications only)
- ❌ Complex template hierarchy
- ❌ Multiple config files
- ❌ Entity-specific provider overrides
- ❌ Status mapper config file

**Migration**: Update config to new `status_notifications` format. Old templates → message field.

## Example: Complete Status Config

```yaml
status_notifications:
  draft:
    enabled: false  # Don't notify for draft

  submitted:
    enabled: true
    recipient: admin
    admin_roles: [reviewer]
    subject: 'New Application Submitted'
    message: |
      Application [application:application_id] submitted by [application:group_name].

      Review at: [application:url]

  under_review:
    enabled: true
    recipient: customer
    subject: 'Application Under Review'
    message: |
      Your application [application:application_id] is now under review.
      We will notify you of our decision soon.

  approved:
    enabled: true
    recipient: customer
    subject: 'Application Approved!'
    message: |
      Great news! Your loan application has been approved.

      Application ID: [application:application_id]
      Loan Amount: [application:loan_amount]

      Next steps: Check your email for disbursement details.

  rejected:
    enabled: true
    recipient: customer
    subject: 'Application Decision'
    message: |
      Your application [application:application_id] has been reviewed.

      Status: Not approved at this time
      Reason: [application:rejection_reason]

      [application:rejection_message]
```

## License

GPL-2.0-or-later
