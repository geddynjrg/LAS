<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Drupal\Component\Plugin\PluginBase;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Defines a plugin for checking Solr connection and version.
 *
 * @HealthCheck(
 *     id="solr",
 *     label=@Translation("Solr Health Check")
 * )
 */
class SolrHealthCheck extends PluginBase implements HealthCheckPluginInterface, ContainerFactoryPluginInterface {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * Constructs a new SolrHealthCheck object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin definition.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, ConfigFactoryInterface $config_factory) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->configFactory = $config_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('config.factory')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): array {
    // Retrieve Solr configuration from settings.
    $solr_host = $this->getSolrHost();
    $solr_port = \Drupal::config('search_api.server.solr')->get('backend_config.connector_config.port');
    $solr_core = \Drupal::config('search_api.server.solr')->get('backend_config.connector_config.core');
    $solr_scheme = \Drupal::config('search_api.server.solr')->get('backend_config.connector_config.scheme');

    if (empty($solr_host) || empty($solr_port) || empty($solr_core)) {
      return [
        'status' => 'DISABLED',
        'message' => 'Solr is disabled or misconfigured.',
      ];
    }

    $solr_url_core = \sprintf('%s://%s:%s/solr/%s', $solr_scheme, $solr_host, $solr_port, $solr_core);
    $solr_url_global = \sprintf('%s://%s:%s/solr', $solr_scheme, $solr_host, $solr_port);

    try {
      // Check Solr core status.
      $ping_response = \Drupal::httpClient()->get($solr_url_core . '/admin/ping', ['timeout' => 5]);

      if ($ping_response->getStatusCode() !== 200) {
        return [
          'status' => 'DOWN',
          'message' => 'Solr core is reachable but returned an unexpected ping status: ' . $ping_response->getStatusCode(),
        ];
      }

      // Check Solr version from the global endpoint.
      $info_response = \Drupal::httpClient()->get($solr_url_global . '/admin/info/system', ['timeout' => 5]);
      $info_data = json_decode($info_response->getBody(), TRUE);

      $solr_version = $info_data['lucene']['solr-spec-version'] ?? 'Unknown version';

      return [
        'status' => 'UP',
        'message' => 'Solr connection is healthy.',
        'version' => $solr_version,
      ];
    }
    catch (\Exception $e) {
      return [
        'status' => 'DOWN',
        'message' => 'Solr connection failed: ' . $e->getMessage(),
        'version' => 'Unknown',
      ];
    }
  }

  /**
   * Gets the Solr host from configuration.
   *
   * @return string
   *   The Solr host.
   */
  protected function getSolrHost() {
    $config = $this->configFactory->get('search_api.server.solr');

    return $config->get('backend_config.connector_config.host') ?: 'localhost';
  }

}
