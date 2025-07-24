# SMS Providers Module

This module provides a unified SMS sending system for Drupal with support for multiple SMS providers.

## Configuration

### Default Provider

Set the default SMS provider in the admin UI at `/admin/config/sms_providers/settings`.

### Provider Configuration

All provider-specific configuration is done through environment variables for security.

#### Debug Provider

The debug provider is available for testing and logs all SMS messages instead of sending them.

## Usage

### Sending SMS via Service

```php
$sms_service = \Drupal::service('sms_providers.sms_service');

// Send using default provider
$result = $sms_service->send('+254712345678', 'Hello from Drupal!');

// Send using specific provider
$result = $sms_service->send('+254712345678', 'Hello from Drupal!', 'provider_id');
```

The service will:
- Validate and normalize the phone number to E.164 format
- Use the specified provider (or default if none specified)
- Return a result array with success status and message details
- Log any errors to the Drupal logs

### Phone Number Normalization

The framework automatically normalizes Kenyan phone numbers to E.164 format:
- `0712345678` → `+254712345678`
- `712345678` → `+254712345678`
- `254712345678` → `+254712345678`
- `+254712345678` → `+254712345678` (no change)

Individual providers receive normalized numbers and can convert them to their required format.

### Testing SMS

The configuration page at `/admin/config/services/sms-providers` includes a test form to send test messages.

## Adding New Providers

To add a new SMS provider, create a separate module that:

1. Implements `\Drupal\sms_providers\Provider\SmsProviderInterface`

2. Registers the provider as a service with the `sms_provider` tag:
   ```yaml
   services:
     mymodule.sms_provider:
       class: Drupal\mymodule\Provider\MyProvider
       arguments: ['@http_client', '@config.factory', '@logger.factory']
       tags:
         - { name: sms_provider, provider_id: my_provider }
   ```

3. Handles its own configuration (recommended via environment variables)