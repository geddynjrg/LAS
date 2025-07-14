<?php

namespace Drupal\ebiscloud_sms\Plugin\SmsProvider;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Site\Settings;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\sms_providers\Plugin\SmsProviderBase;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides EBISCloud SMS provider.
 *
 * @SmsProvider(
 *     id="ebiscloud",
 *     label=@Translation("EBISCloud SMS"),
 * )
 */
class EbisCloudSmsProvider extends SmsProviderBase {

  use StringTranslationTrait;

  // Configuration keys.
  public const CONFIG_API_KEY = 'api_key';

  public const CONFIG_API_URL = 'api_url';

  public const CONFIG_SERVICE_ID = 'service_id';

  public const CONFIG_SHORTCODE = 'shortcode';

  // API constants.
  public const RESPONSE_TYPE_JSON = 'json';

  // Settings constants.
  public const SETTINGS_KEY = 'ebiscloud_sms';

  /**
   * The HTTP client.
   */
  protected ClientInterface $httpClient;

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state): array {
    $form = parent::buildConfigurationForm($form, $form_state);

    // Add instructions for settings.local.php configuration.
    $form['settings_instructions'] = [
      '#type' => 'details',
      '#title' => $this->t('Settings Configuration (Recommended)'),
      '#description' => $this->t('For security, configure sensitive settings in settings.local.php instead of storing them in the database.'),
      '#open' => FALSE,
    ];

    $form['settings_instructions']['instructions'] = [
      '#markup' => $this->t('
        <p>Add the following to your <code>settings.local.php</code> file:</p>
        <pre><code>$settings[\'@settings_key\'] = [
  \'@api_key\' => \'your-ebiscloud-api-key-here\',
  \'@service_id\' => \'0\', // or your service ID
  \'@shortcode\' => \'YOUR_SHORTCODE\',
  \'@api_url\' => \'@default_api_url\',
];</code></pre>
        <p>When configured in settings, the form fields below will be disabled and values will be used from settings instead of the database.</p>
      ', [
        '@settings_key' => self::SETTINGS_KEY,
        '@api_key' => self::CONFIG_API_KEY,
        '@service_id' => self::CONFIG_SERVICE_ID,
        '@shortcode' => self::CONFIG_SHORTCODE,
        '@api_url' => self::CONFIG_API_URL,
        '@default_api_url' => 'https://bulk.ebisclouderp.com/api/sms/sendsms',
      ]),
    ];

    // Check if API key is set in settings.
    $settings_api_key = Settings::get(self::SETTINGS_KEY)[self::CONFIG_API_KEY] ?? '';
    $is_set_in_settings = !empty($settings_api_key);

    $form[self::CONFIG_API_KEY] = [
      '#type' => 'textfield',
      '#title' => $this->t('API Key'),
      '#default_value' => $this->configuration[self::CONFIG_API_KEY] ?? '',
      '#required' => !$is_set_in_settings,
      '#disabled' => $is_set_in_settings,
    ];

    if ($is_set_in_settings) {
      $form[self::CONFIG_API_KEY]['#description'] = $this->t('API key is configured in settings.local.php and cannot be changed here. Current value: @value', [
        '@value' => substr($settings_api_key, 0, 8) . '...',
      ]);
      $form[self::CONFIG_API_KEY]['#default_value'] = substr($settings_api_key, 0, 8) . '...';
    }
    else {
      $form[self::CONFIG_API_KEY]['#description'] = $this->t('Your EBISCloud API key. Can also be set in settings.local.php as $settings["@settings_key"]["@api_key"].', [
        '@settings_key' => self::SETTINGS_KEY,
        '@api_key' => self::CONFIG_API_KEY,
      ]);
    }

    // Check if service_id is set in settings.
    $settings_service_id = Settings::get(self::SETTINGS_KEY)[self::CONFIG_SERVICE_ID] ?? '';
    $service_id_in_settings = $settings_service_id !== '';

    $form[self::CONFIG_SERVICE_ID] = [
      '#type' => 'textfield',
      '#title' => $this->t('Service ID'),
      '#description' => $service_id_in_settings
        ? $this->t('Service ID is configured in settings.local.php: @value', ['@value' => $settings_service_id])
        : $this->t('Your EBISCloud service ID (can be 0 for some accounts).'),
      '#default_value' => $service_id_in_settings ? $settings_service_id : ($this->configuration[self::CONFIG_SERVICE_ID] ?? ''),
      '#required' => !$service_id_in_settings,
      '#disabled' => $service_id_in_settings,
    ];

    // Check if shortcode is set in settings.
    $settings_shortcode = Settings::get(self::SETTINGS_KEY)[self::CONFIG_SHORTCODE] ?? '';
    $shortcode_in_settings = !empty($settings_shortcode);

    $form[self::CONFIG_SHORTCODE] = [
      '#type' => 'textfield',
      '#title' => $this->t('Shortcode'),
      '#description' => $shortcode_in_settings
        ? $this->t('Shortcode is configured in settings.local.php: @value', ['@value' => $settings_shortcode])
        : $this->t('SMS shortcode for sending messages.'),
      '#default_value' => $shortcode_in_settings ? $settings_shortcode : ($this->configuration[self::CONFIG_SHORTCODE] ?? ''),
      '#required' => !$shortcode_in_settings,
      '#disabled' => $shortcode_in_settings,
    ];

    // Check if api_url is set in settings.
    $settings_api_url = Settings::get(self::SETTINGS_KEY)[self::CONFIG_API_URL] ?? '';
    $api_url_in_settings = !empty($settings_api_url);

    $form[self::CONFIG_API_URL] = [
      '#type' => 'url',
      '#title' => $this->t('API URL'),
      '#description' => $api_url_in_settings
        ? $this->t('API URL is configured in settings.local.php: @value', ['@value' => $settings_api_url])
        : $this->t('EBISCloud API endpoint URL.'),
      '#default_value' => $api_url_in_settings ? $settings_api_url : ($this->configuration[self::CONFIG_API_URL] ?? 'https://bulk.ebisclouderp.com/api/sms/sendsms'),
      '#required' => !$api_url_in_settings,
      '#disabled' => $api_url_in_settings,
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): static {
    $instance = parent::create($container, $configuration, $plugin_id, $plugin_definition);
    /** @var \GuzzleHttp\ClientInterface $http_client */
    $http_client = $container->get('http_client');
    $instance->httpClient = $http_client;

    return $instance;
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return [
      self::CONFIG_API_KEY => '',
      self::CONFIG_SERVICE_ID => '',
      self::CONFIG_SHORTCODE => '',
      self::CONFIG_API_URL => 'https://bulk.ebisclouderp.com/api/sms/sendsms',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getLabel(): string {
    return $this->t('EBISCloud SMS');
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured(): bool {
    $settings = Settings::get(self::SETTINGS_KEY) ?? [];

    // Check if API key is available (either in settings or configuration).
    $has_api_key = !empty($this->getApiKey());

    // Check service_id (either in settings or configuration).
    // Service ID can be '0' which is a valid value.
    $has_service_id = (isset($settings[self::CONFIG_SERVICE_ID]) && $settings[self::CONFIG_SERVICE_ID] !== '')
      || (isset($this->configuration[self::CONFIG_SERVICE_ID]) && $this->configuration[self::CONFIG_SERVICE_ID] !== '');

    // Check shortcode (either in settings or configuration).
    $has_shortcode = !empty($settings[self::CONFIG_SHORTCODE])
      || !empty($this->configuration[self::CONFIG_SHORTCODE]);

    // Check API URL (either in settings or configuration).
    $has_api_url = !empty($settings[self::CONFIG_API_URL])
      || !empty($this->configuration[self::CONFIG_API_URL]);

    return $has_api_key
      && $has_service_id
      && $has_shortcode
      && $has_api_url;
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state): void {
    parent::submitConfigurationForm($form, $form_state);

    // Only save API key if not set in settings.
    $settings = Settings::get(self::SETTINGS_KEY);

    if (empty($settings[self::CONFIG_API_KEY])) {
      $this->configuration[self::CONFIG_API_KEY] = $form_state->getValue(self::CONFIG_API_KEY);
    }

    // Only save service_id if not set in settings.
    if (!isset($settings[self::CONFIG_SERVICE_ID]) || $settings[self::CONFIG_SERVICE_ID] === '') {
      $this->configuration[self::CONFIG_SERVICE_ID] = $form_state->getValue(self::CONFIG_SERVICE_ID);
    }

    // Only save shortcode if not set in settings.
    if (empty($settings[self::CONFIG_SHORTCODE])) {
      $this->configuration[self::CONFIG_SHORTCODE] = $form_state->getValue(self::CONFIG_SHORTCODE);
    }

    // Only save API URL if not set in settings.
    if (empty($settings[self::CONFIG_API_URL])) {
      $this->configuration[self::CONFIG_API_URL] = $form_state->getValue(self::CONFIG_API_URL);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function validateConfigurationForm(array &$form, FormStateInterface $form_state): void {
    parent::validateConfigurationForm($form, $form_state);

    $api_key = $form_state->getValue(self::CONFIG_API_KEY);
    $service_id = $form_state->getValue(self::CONFIG_SERVICE_ID);
    $shortcode = $form_state->getValue(self::CONFIG_SHORTCODE);
    $api_url = $form_state->getValue(self::CONFIG_API_URL);

    // Only validate API key if not set in settings.
    $settings_api_key = Settings::get(self::SETTINGS_KEY)[self::CONFIG_API_KEY] ?? '';

    if (empty($settings_api_key) && empty($api_key)) {
      $form_state->setErrorByName(self::CONFIG_API_KEY, $this->t('API Key is required.'));
    }

    // Only validate service_id if not set in settings.
    $settings_service_id = Settings::get(self::SETTINGS_KEY)[self::CONFIG_SERVICE_ID] ?? '';

    if ($settings_service_id === '' && (!isset($service_id) || $service_id === '')) {
      $form_state->setErrorByName(self::CONFIG_SERVICE_ID, $this->t('Service ID is required.'));
    }

    // Only validate shortcode if not set in settings.
    $settings_shortcode = Settings::get(self::SETTINGS_KEY)[self::CONFIG_SHORTCODE] ?? '';

    if (empty($settings_shortcode) && empty($shortcode)) {
      $form_state->setErrorByName(self::CONFIG_SHORTCODE, $this->t('Shortcode is required.'));
    }

    // Only validate API URL if not set in settings.
    $settings_api_url = Settings::get(self::SETTINGS_KEY)[self::CONFIG_API_URL] ?? '';

    if (empty($settings_api_url)) {
      if (empty($api_url)) {
        $form_state->setErrorByName(self::CONFIG_API_URL, $this->t('API URL is required.'));
      }
      elseif (!filter_var($api_url, \FILTER_VALIDATE_URL)) {
        $form_state->setErrorByName(self::CONFIG_API_URL, $this->t('Please enter a valid API URL.'));
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  protected function doSendSms(string $to, string $message, array $options = []): array {
    if (!$this->isConfigured()) {
      return [
        'success' => FALSE,
        'message' => $this->t('EBISCloud provider is not properly configured.'),
        'error_code' => parent::ERROR_CODE_NOT_CONFIGURED,
      ];
    }

    try {
      // Get the API key from the Key module.
      $api_key = $this->getApiKey();

      if ($api_key === NULL) {
        return [
          'success' => FALSE,
          'message' => $this->t('Could not retrieve API key from key storage.'),
          'error_code' => parent::ERROR_CODE_NOT_CONFIGURED,
        ];
      }

      // Get service_id from settings or configuration.
      $settings = Settings::get(self::SETTINGS_KEY);
      $service_id = $settings[self::CONFIG_SERVICE_ID] ?? $this->configuration[self::CONFIG_SERVICE_ID];

      // Get shortcode from settings or configuration.
      $shortcode = $settings[self::CONFIG_SHORTCODE] ?? $this->configuration[self::CONFIG_SHORTCODE];

      // Get API URL from settings or configuration.
      $api_url = $settings[self::CONFIG_API_URL] ?? $this->configuration[self::CONFIG_API_URL];

      // Prepare request data for EBISCloud API.
      $request_data = [
        'api_key' => $api_key,
        'service_id' => $service_id,
        'mobile' => $this->formatPhoneNumber($to),
        'response_type' => self::RESPONSE_TYPE_JSON,
        'shortcode' => $shortcode,
        'message' => $message,
      ];

      // Add scheduled sending if date_send is provided in options.
      if (!empty($options['date_send'])) {
        $request_data['date_send'] = $options['date_send'];
      }

      // Make the API request.
      $response = $this->httpClient->request('POST', $api_url, [
        'json' => $request_data,
        'timeout' => 30,
        'headers' => [
          'User-Agent' => 'Drupal-EBISCloud-SMS/1.0',
          'Accept' => 'application/json',
          'Content-Type' => 'application/json',
        ],
      ]);

      $status_code = $response->getStatusCode();
      $response_body = (string) $response->getBody();

      // Parse the response.
      $response = $this->parseApiResponse($status_code, $response_body);

      if ($response['success']) {
        return [
          'success' => TRUE,
          'message' => $this->t('SMS sent successfully via EBISCloud.'),
          'message_id' => $response['message_id'] ?? NULL,
          'provider_response' => $response,
        ];
      }

      return [
        'success' => FALSE,
        'message' => $this->t('Failed to send SMS via EBISCloud: @error', [
          '@error' => $response['error'] ?? 'Unknown error',
        ]),
        'error_code' => $response['error_code'] ?? parent::ERROR_CODE_API_ERROR,
        'provider_response' => $response,
      ];
    }
    catch (RequestException $e) {
      $error_message = $e->getMessage();
      $response_body = '';

      if ($e->hasResponse() && $e->getResponse()) {
        $response_body = (string) $e->getResponse()->getBody();
      }

      return [
        'success' => FALSE,
        'message' => $this->t('API request failed: @error', [
          '@error' => $error_message,
        ]),
        'error_code' => parent::ERROR_CODE_REQUEST_FAILED,
        'response_body' => $response_body,
      ];
    }
    catch (GuzzleException $e) {
      return [
        'success' => FALSE,
        'message' => $this->t('HTTP client error: @error', [
          '@error' => $e->getMessage(),
        ]),
        'error_code' => parent::ERROR_CODE_HTTP_ERROR,
      ];
    }
    catch (\Exception $e) {
      return [
        'success' => FALSE,
        'message' => $this->t('Unexpected error: @error', [
          '@error' => $e->getMessage(),
        ]),
        'error_code' => parent::ERROR_CODE_UNEXPECTED_ERROR,
      ];
    }
  }

  /**
   * Formats a phone number for EBISCloud SMS sending.
   *
   * @param string $phone_number
   *   The phone number to format.
   *
   * @return string
   *   The formatted phone number in EBISCloud format (2547XXXXXXXX).
   */
  protected function formatPhoneNumber(string $phone_number): string {
    // Remove any non-digit characters.
    $formatted = preg_replace('/[^\d]/', '', $phone_number) ?? '';

    // Handle different input formats and convert to 2547XXXXXXXX format.
    if (str_starts_with($formatted, '254')) {
      // Already in correct format: 254XXXXXXXXX.
      return $formatted;
    }

    if (str_starts_with($formatted, '0')) {
      // Remove leading 0 and add 254: 0XXXXXXXXX -> 254XXXXXXXXX.
      return '254' . substr($formatted, 1);
    }

    if (str_starts_with($formatted, '7') && \strlen($formatted) === 9) {
      // Add 254 prefix: 7XXXXXXXX -> 2547XXXXXXXX.
      return '254' . $formatted;
    }

    // Default case: assume it needs 254 prefix.
    return '254' . $formatted;
  }

  /**
   * Gets the API key from the Key module.
   *
   * @return string|null
   *   The API key value or NULL if not found/configured.
   */
  protected function getApiKey(): ?string {
    // First try to get from Drupal settings.
    $settings = Settings::get(self::SETTINGS_KEY);

    if (!empty($settings[self::CONFIG_API_KEY])) {
      return $settings[self::CONFIG_API_KEY];
    }

    // Fallback to configuration (for when not set in settings).
    $config_key = $this->configuration[self::CONFIG_API_KEY] ?? '';

    if (!empty($config_key)) {
      return $config_key;
    }

    return NULL;
  }

  /**
   * Parses the EBISCloud API response.
   *
   * @param int $status_code
   *   The HTTP status code.
   * @param string $response_body
   *   The response body.
   *
   * @return array
   *   Parsed response array.
   */
  protected function parseApiResponse(int $status_code, string $response_body): array {
    // Try to decode JSON response.
    $json_data = json_decode($response_body, TRUE);

    if ($status_code === 200) {
      if ($json_data && isset($json_data['status_code'])) {
        // Handle EBISCloud JSON response format.
        if ($json_data['status_code'] === '1000') {
          return [
            'success' => TRUE,
            'message' => $json_data['status_desc'] ?? 'SMS sent successfully',
            'message_id' => $json_data['message_id'] ?? uniqid('ebc_'),
            'mobile_number' => $json_data['mobile_number'] ?? '',
            'message_cost' => $json_data['message_cost'] ?? 0,
            'credit_balance' => $json_data['credit_balance'] ?? 0,
            'network_id' => $json_data['network_id'] ?? '',
            'response_data' => $json_data,
          ];
        }

        return [
          'success' => FALSE,
          'error' => $json_data['status_desc'] ?? 'Unknown error from API',
          'error_code' => $json_data['status_code'] ?? parent::ERROR_CODE_API_ERROR,
          'response_data' => $json_data,
        ];
      }

      // Handle plain text response - assume success if status is 200.
      if (stripos($response_body, 'success') !== FALSE || stripos($response_body, 'sent') !== FALSE) {
        return [
          'success' => TRUE,
          'message' => 'SMS sent successfully',
          'message_id' => uniqid('ebc_'),
          'response_data' => $response_body,
        ];
      }

      return [
        'success' => FALSE,
        'error' => $response_body ?: 'Empty response from API',
        'error_code' => parent::ERROR_CODE_EMPTY_RESPONSE,
        'response_data' => $response_body,
      ];
    }

    // Handle error status codes.
    $error_message = 'HTTP error ' . $status_code;

    if ($json_data && isset($json_data['message'])) {
      $error_message = $json_data['message'];
    }
    elseif ($json_data && isset($json_data['error'])) {
      $error_message = $json_data['error'];
    }
    elseif (!empty($response_body)) {
      $error_message = $response_body;
    }

    return [
      'success' => FALSE,
      'error' => $error_message,
      'error_code' => 'HTTP_' . $status_code,
      'response_data' => $json_data ?: $response_body,
    ];
  }

}
