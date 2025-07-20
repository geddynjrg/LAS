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

    // Service ID can be '0' which is a valid value.
    $has_service_id = isset($settings[self::CONFIG_SERVICE_ID]) && $settings[self::CONFIG_SERVICE_ID] !== '';

    $has_shortcode = !empty($settings[self::CONFIG_SHORTCODE]);

    $has_api_url = !empty($settings[self::CONFIG_API_URL]);

    return $has_api_key && $has_service_id && $has_shortcode && $has_api_url;
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
      $api_url = $settings[self::CONFIG_API_URL] ?? 'https://bulk.ebisclouderp.com/api/sms/sendsms';

      // Prepare request data.
      // Note: $to is already normalized by SMS service to E.164 (+254XXXXXXXXX)
      // Convert to EBIS format (254XXXXXXXXX) by removing the '+' prefix.
      $mobile = ltrim($to, '+');

      $request_data = [
        'api_key' => $api_key,
        'service_id' => $service_id,
        'mobile' => $mobile,
        'response_type' => 'json',
        'shortcode' => $shortcode,
        'message' => $message,
      ];

      // Make the API request.
      $response = $this->httpClient->request('POST', $api_url, [
        'json' => $request_data,
        'timeout' => 30,
        'headers' => [
          'User-Agent' => 'Drupal-SMS-Providers/1.0',
          'Accept' => 'application/json',
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
   *   Parsed response array with 'success', 'message_id', and 'error' keys.
   */
  protected function parseApiResponse(int $status_code, string $response_body): array {
    // Try to decode JSON response.
    $json_data = json_decode($response_body, TRUE);

    if ($status_code === 200) {
      if ($json_data && isset($json_data['status_code'])) {
        // Handle EBIS Cloud JSON response format.
        if ($json_data['status_code'] === self::RESPONSE_SUCCESS) {
          return [
            'success' => TRUE,
            'message_id' => $json_data['message_id'] ?? uniqid('ebis_'),
          ];
        }

        return [
          'success' => FALSE,
          'error' => $json_data['status_desc'] ?? 'Unknown error from API',
        ];
      }

      // Handle plain text response - assume success if status is 200.
      if (stripos($response_body, 'success') !== FALSE || stripos($response_body, 'sent') !== FALSE) {
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
    ];
  }

}
