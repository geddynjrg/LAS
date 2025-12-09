<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Drupal\Component\Plugin\PluginBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\RequestException;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Defines a plugin for checking external services.
 *
 * @HealthCheck(
 *     id="external_service",
 *     label=@Translation("External Service Health Check")
 * )
 */
class ExternalServiceHealthCheck extends PluginBase implements HealthCheckPluginInterface, ContainerFactoryPluginInterface {

  /**
   * The HTTP client.
   *
   * @var \GuzzleHttp\ClientInterface
   */
  protected $httpClient;

  /**
   * Constructs a new ExternalServiceHealthCheck.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \GuzzleHttp\ClientInterface $http_client
   *   The HTTP client.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, ClientInterface $http_client) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->httpClient = $http_client;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('http_client')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): array {
    $results = [];

    // Check for any new generic services configuration (if exists).
    $services = \Drupal::service('settings')->get('external_services', []);

    foreach ($services as $service_name => $url) {
      if (empty($url)) {
        $results[$service_name] = [
          'status' => 'DISABLED',
          'error' => 'Service URL is not configured.',
        ];
      }
      else {
        $url .= '/healthz';
        $results[$service_name] = $this->formatServiceCheckResult($url);
      }
    }

    return $results;
  }

  /**
   * Generic external service health check.
   */
  protected function checkExternalService($url): array {
    try {
      $response = $this->httpClient->request('GET', $url, ['verify' => FALSE]);
      $responseData = json_decode($response->getBody(), TRUE);

      // Check for "status" in the response, assume "DOWN" if it's not "UP".
      $status = isset($responseData['status']) && $responseData['status'] === 'UP' ? 'UP' : 'DOWN';

      return [
        'status' => $status,
        'response_code' => $response->getStatusCode(),
      ];
    }
    catch (RequestException $e) {
      return [
        'status' => 'DOWN',
        'response_code' => $e->getCode(),
        'error' => $e->getMessage(),
      ];
    }
    catch (\Exception $e) {
      return [
        'status' => 'DOWN',
        'response_code' => 0,
        'error' => $e->getMessage(),
      ];
    }
  }

  /**
   * Formats the result for the external service health check.
   */
  protected function formatServiceCheckResult($url): array {
    $result = $this->checkExternalService($url);

    return [
      'status' => $result['status'],
      'endpoint' => $url,
      'response_code' => $result['response_code'],
      'error' => $result['status'] === 'DOWN' ? $result['error'] : NULL,
    ];
  }

}
