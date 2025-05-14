<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Drupal\Component\Plugin\PluginBase;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;
use Elasticsearch\ClientBuilder;

/**
 * Defines a plugin for checking Elasticsearch connection.
 *
 * @HealthCheck(
 *     id="elasticsearch",
 *     label=@Translation("Elasticsearch Health Check")
 * )
 */
class ElasticsearchHealthCheck extends PluginBase implements HealthCheckPluginInterface {

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): array {
    // Check if Elasticsearch is enabled.
    $elastic_url = \Drupal::config('elasticsearch_connector.cluster.search')->get('url');

    if (empty($elastic_url)) {
      return [
        'status' => 'DISABLED',
        'message' => 'Elasticsearch is disabled.',
      ];
    }

    try {
      if (!class_exists('Elasticsearch\ClientBuilder')) {
        return [
          'status' => 'DOWN',
          'message' => 'Elasticsearch client is not installed.',
        ];
      }

      // Create Elasticsearch client and check connection.
      $client = ClientBuilder::create()->setHosts([$elastic_url])->build();
      $client->ping();

      return [
        'status' => 'UP',
        'message' => 'Elasticsearch connection is healthy.',
      ];
    }
    catch (\Exception $e) {
      return [
        'status' => 'DOWN',
        'message' => 'Elasticsearch connection failed: ' . $e->getMessage(),
      ];
    }
  }

}
