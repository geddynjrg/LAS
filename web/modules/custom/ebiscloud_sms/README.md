# EBIS Cloud SMS Module

Provides EBIS Cloud SMS provider integration for the SMS Providers framework.

## Requirements

- SMS Providers module
- Valid EBIS Cloud SMS account

## Configuration

Configure the EBIS provider by adding the following to your `settings.local.php`:

```php
$settings['ebiscloud_sms'] = [
  'api_key' => getenv('EBIS_SMS_API_KEY'),
  'service_id' => getenv('EBIS_SMS_SERVICE_ID') ?: '0',
  'shortcode' => getenv('EBIS_SMS_SHORTCODE'),
  'api_url' => getenv('EBIS_SMS_API_URL') ?: 'https://bulk.ebisclouderp.com/api/sms/sendsms',
];
```

Then set these environment variables:
- `EBIS_SMS_API_KEY`: Your EBIS Cloud API key (required)
- `EBIS_SMS_SERVICE_ID`: Your service ID (required, can be '0' for some accounts)
- `EBIS_SMS_SHORTCODE`: Your SMS shortcode (required)
- `EBIS_SMS_API_URL`: API endpoint URL (optional, defaults to EBIS Cloud production URL)

## Usage

Once configured, the EBIS provider will be available in the SMS Providers module. You can set it as the default provider at `/admin/config/sms_providers/settings` or specify it when sending messages.

## API Response Handling

The module handles the following EBIS Cloud response codes:
- `1000`: Success
- Other codes: Treated as errors with descriptive messages

## Troubleshooting

Check the Drupal logs for detailed error messages if SMS sending fails. Common issues:
- Missing or invalid API credentials
- Incorrect phone number format
- Insufficient SMS credits
- Network connectivity issues