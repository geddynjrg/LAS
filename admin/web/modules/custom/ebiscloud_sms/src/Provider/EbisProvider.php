<?php

namespace Drupal\ebiscloud_sms\Provider;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\Core\Site\Settings;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\sms_providers\Provider\SmsProviderInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;

/**
 * EBIS Cloud SMS provider implementation.
 */
class EbisProvider implements SmsProviderInterface {

  use StringTranslationTrait;

  /**
   * Configuration keys.
   */
  public const CONFIG_API_KEY = 'api_key';

  public const CONFIG_API_URL = 'api_url';

  public const CONFIG_SERVICE_ID = 'service_id';

  public const CONFIG_SHORTCODE = 'shortcode';

  /**
   * Response codes.
   */
  public const RESPONSE_SUCCESS = '1000';

  /**
   * Settings key in settings.php.
   */
  public const SETTINGS_KEY = 'ebiscloud_sms';

  /**
   * The configuration factory.
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * The HTTP client.
   */
  protected ClientInterface $httpClient;

  /**
   * The logger channel.
   */
  protected LoggerChannelInterface $logger;

  /**
   * Constructs an EbisProvider object.
   *
   * @param \GuzzleHttp\ClientInterface $http_client
   *   The HTTP client.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The configuration factory.
   * @param \Drupal\Core\Logger\LoggerChannelInterface $logger
   *   The logger channel.
   */
  public function __construct(
    ClientInterface $http_client,
    ConfigFactoryInterface $config_factory,
    LoggerChannelInterface $logger,
  ) {
    $this->httpClient = $http_client;
    $this->configFactory = $config_factory;
    $this->logger = $logger;
  }

  /**
   * {@inheritdoc}
   */
  public function getId(): string {
    return 'ebis';
  }

  /**
   * {@inheritdoc}
   */
  public function getName(): string {
    return 'EBIS Cloud SMS';
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured(): bool {
    $settings = Settings::get(self::SETTINGS_KEY) ?? [];

    // Check if all required settings are available.
    $has_api_key = !empty($settings[self::CONFIG_API_KEY]);

    $has_shortcode = !empty($settings[self::CONFIG_SHORTCODE]);

    $has_api_url = !empty($settings[self::CONFIG_API_URL]);

    return $has_api_key && $has_shortcode && $has_api_url;
  }

  /**
   * {@inheritdoc}
   */
  public function sendSms(string $to, string $message): string {
    if (!$this->isConfigured()) {
      throw new \Exception('EBIS provider is not properly configured');
    }

    try {
      $api_key = $this->getApiKey();

      if ($api_key === NULL) {
        throw new \Exception('Could not retrieve API key');
      }

      // Get configuration values from settings only.
      $settings = Settings::get(self::SETTINGS_KEY) ?? [];

      $service_id = $settings[self::CONFIG_SERVICE_ID] ?? '';
      $shortcode = $settings[self::CONFIG_SHORTCODE] ?? '';
      $api_url = $settings[self::CONFIG_API_URL] ?? '';

      // Prepare request data.
      // Note: $to is already normalized by SMS service to E.164 (+254XXXXXXXXX)
      // Convert to EBIS format (254XXXXXXXXX) by removing the '+' prefix.
      $mobile = ltrim($to, '+');

      $request_data = [
        'api_key' => $api_key,
        'mobile' => $mobile,
        'response_type' => 'json',
        'shortcode' => $shortcode,
        'message' => $message,
      ];

      // Add service_id - default to 0 if not set.
      $request_data['service_id'] = $service_id !== '' ? (int) $service_id : 0;

      // Make the API request.
      $response = $this->httpClient->request('POST', $api_url, [
        'json' => $request_data,
        'timeout' => 12,
        'headers' => [
          'User-Agent' => 'Drupal-SMS-Providers/1.0',
          'Content-Type' => 'application/json',
        ],
      ]);

      $status_code = $response->getStatusCode();
      $response_body = (string) $response->getBody();

      // Parse the response.
      $parsed = $this->parseApiResponse($status_code, $response_body);

      if ($parsed['success']) {
        $this->logger->info('SMS sent successfully via EBIS to @number', ['@number' => $to]);

        return $parsed['message_id'] ?? uniqid('ebis_');
      }

      throw new \Exception($parsed['error'] ?? 'Failed to send SMS');
    }
    catch (RequestException $e) {
      $error_message = $e->getMessage();

      if ($e->hasResponse() && $e->getResponse()) {
        $response_body = (string) $e->getResponse()->getBody();
        $this->logger->error('EBIS API request failed: @error. Response: @response', [
          '@error' => $error_message,
          '@response' => $response_body,
        ]);
      }
      else {
        $this->logger->error('EBIS API request failed: @error', ['@error' => $error_message]);
      }

      throw new \Exception('API request failed: ' . $error_message);
    }
    catch (GuzzleException $e) {
      $this->logger->error('HTTP client error: @error', ['@error' => $e->getMessage()]);

      throw new \Exception('HTTP client error: ' . $e->getMessage());
    }
  }

  /**
   * Gets the API key from settings.
   *
   * @return string|null
   *   The API key value or NULL if not found.
   */
  protected function getApiKey(): ?string {
    $settings = Settings::get(self::SETTINGS_KEY);

    if (!empty($settings[self::CONFIG_API_KEY])) {
      return $settings[self::CONFIG_API_KEY];
    }

    return NULL;
  }

  /**
   * Parses the EBIS Cloud API response.
   *
   * @param int $status_code
   *   The HTTP status code.
   * @param string $response_body
   *   The response body.
   *
   * @return array
   *   Parsed response array with 'success', 'message_id', 'cost', and
   *   'error' keys.
   */
  protected function parseApiResponse(int $status_code, string $response_body): array {
    // Try to decode JSON response.
    $json_data = json_decode($response_body, TRUE);

    if ($status_code === 200) {
      if (is_array($json_data)) {
        // Explicit failure from the current EBIS batch API.
        if (array_key_exists('success', $json_data) && $json_data['success'] === FALSE) {
          return [
            'success' => FALSE,
            'error' => $json_data['message'] ?? $json_data['error'] ?? 'SMS could not be sent',
          ];
        }

        if ($this->isEbisSuccessPayload($json_data)) {
          $message_id = $json_data['data']['message_id']
            ?? $json_data['message_id']
            ?? NULL;
          if ($message_id === NULL && !empty($json_data['details'][0]['message_id'])) {
            $message_id = $json_data['details'][0]['message_id'];
          }

          $result = [
            'success' => TRUE,
            'message_id' => $message_id ?? uniqid('ebis_'),
          ];

          if (isset($json_data['data']['cost'])) {
            $result['cost'] = $json_data['data']['cost'];
          }
          elseif (isset($json_data['details'][0]['message_cost'])) {
            $result['cost'] = $json_data['details'][0]['message_cost'];
          }

          return $result;
        }

        return [
          'success' => FALSE,
          'error' => $json_data['message'] ?? $json_data['error'] ?? 'Unknown error from API',
        ];
      }

      // Plain-text response only — never regex the JSON body (avoids matching
      // the key name "success" inside {"success":false,...}).
      if (preg_match('/\b(success|sent|accepted|queued|submitted)\b/i', $response_body)) {
        return [
          'success' => TRUE,
          'message_id' => uniqid('ebis_'),
        ];
      }

      return [
        'success' => FALSE,
        'error' => $response_body ?: 'Empty response from API',
      ];
    }

    // Handle error status codes.
    $error_message = 'HTTP error ' . $status_code;

    if (is_array($json_data) && isset($json_data['message'])) {
      $error_message = $json_data['message'];
    }
    elseif (is_array($json_data) && isset($json_data['error'])) {
      $error_message = $json_data['error'];
    }
    elseif (!empty($response_body)) {
      $error_message = $response_body;
    }

    return [
      'success' => FALSE,
      'error' => $error_message,
    ];
  }

  /**
   * Whether an EBIS JSON body indicates the SMS was accepted.
   */
  protected function isEbisSuccessPayload(array $json_data): bool {
    // Current EBIS API: {"success":true,"summary":{"successful":1},...}
    if (array_key_exists('success', $json_data)) {
      if ($json_data['success'] === TRUE || $json_data['success'] === 1 || $json_data['success'] === '1') {
        $summary = $json_data['summary'] ?? NULL;
        if (is_array($summary) && array_key_exists('successful', $summary)) {
          return (int) $summary['successful'] > 0;
        }
        return TRUE;
      }
      return FALSE;
    }

    $status = $json_data['status'] ?? $json_data['status_code'] ?? $json_data['code'] ?? NULL;
    if ($status !== NULL) {
      $normalized = strtoupper(trim((string) $status));
      $success_codes = [
        self::RESPONSE_SUCCESS,
        '0',
        '00',
        '200',
        '1001',
        'SUCCESS',
        'OK',
        'SENT',
        'ACCEPTED',
        'QUEUED',
      ];
      if (in_array($normalized, $success_codes, TRUE)) {
        return TRUE;
      }
    }

    // Legacy array payload: [{"status_code":"1000",...}]
    if (array_is_list($json_data) && isset($json_data[0]) && is_array($json_data[0])) {
      $code = (string) ($json_data[0]['status_code'] ?? $json_data[0]['status'] ?? '');
      return $code === self::RESPONSE_SUCCESS || $code === '1';
    }

    if (!empty($json_data['details']) && is_array($json_data['details'])) {
      $first = $json_data['details'][0] ?? NULL;
      if (is_array($first)) {
        $code = (string) ($first['status_code'] ?? '');
        return $code === self::RESPONSE_SUCCESS || $code === '1';
      }
    }

    $message = (string) ($json_data['message'] ?? $json_data['description'] ?? '');
    if ($message === '') {
      return FALSE;
    }

    return (bool) preg_match('/\b(success|sent|accepted|queued|submitted)\b/i', $message);
  }

}
