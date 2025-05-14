<?php

namespace Drupal\healthcheck\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\healthcheck\HealthCheckPluginManager;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Response;

/**
 * Controller for metrics endpoints.
 *
 * Provides endpoints for monitoring system metrics and performance data.
 */
class MetricsController extends ControllerBase {

  /**
   * The health check plugin manager.
   *
   * @var \Drupal\healthcheck\HealthCheckPluginManager
   */
  protected $healthCheckPluginManager;

  /**
   * Constructs a new MetricsController.
   *
   * @param \Drupal\healthcheck\HealthCheckPluginManager $health_check_plugin_manager
   *   The health check plugin manager.
   */
  public function __construct(HealthCheckPluginManager $health_check_plugin_manager) {
    $this->healthCheckPluginManager = $health_check_plugin_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('plugin.manager.health_check')
    );
  }

  /**
   * Returns metrics in Prometheus format.
   */
  public function metrics() {
    // Get the status of each service.
    /** @var \Drupal\healthcheck\Plugin\HealthCheckPluginInterface $elasticsearch_plugin */
    $elasticsearch_plugin = $this->healthCheckPluginManager->createInstance('elasticsearch');
    $elasticsearch_status = $elasticsearch_plugin->runHealthCheck();

    /** @var \Drupal\healthcheck\Plugin\HealthCheckPluginInterface $solr_plugin */
    $solr_plugin = $this->healthCheckPluginManager->createInstance('solr');
    $solr_status = $solr_plugin->runHealthCheck();

    /** @var \Drupal\healthcheck\Plugin\HealthCheckPluginInterface $redis_plugin */
    $redis_plugin = $this->healthCheckPluginManager->createInstance('redis');
    $redis_status = $redis_plugin->runHealthCheck();

    /** @var \Drupal\healthcheck\Plugin\HealthCheckPluginInterface $database_plugin */
    $database_plugin = $this->healthCheckPluginManager->createInstance('database');
    $database_status = $database_plugin->runHealthCheck();

    /** @var \Drupal\healthcheck\Plugin\HealthCheckPluginInterface $s3_plugin */
    $s3_plugin = $this->healthCheckPluginManager->createInstance('s3');
    $s3_status = $s3_plugin->runHealthCheck();

    /** @var \Drupal\healthcheck\Plugin\HealthCheckPluginInterface $drupal_plugin */
    $drupal_plugin = $this->healthCheckPluginManager->createInstance('drupal_status');
    $drupal_status = $drupal_plugin->runHealthCheck();

    // Translate health status into numerical values for Prometheus.
    $metrics = $this->getCustomMetrics(
      $elasticsearch_status,
      $solr_status,
      $redis_status,
      $database_status,
      $s3_status,
      $drupal_status
    );

    // Return the metrics as a plain text response.
    $response = new Response($metrics);
    $response->headers->set('Content-Type', 'text/plain');

    return $response;
  }

  /**
   * Prepare custom health metrics.
   */
  protected function getCustomMetrics(...$statuses) {
    $metric_strings = [];

    // Prepare metrics output for each service.
    $services = ['elasticsearch', 'solr', 'redis', 'database', 's3', 'web'];

    foreach ($services as $index => $service) {
      $status = $statuses[$index]['status'] === 'UP' ? 1 : 0;
      $metric_strings[] = "# HELP {$service}_health " . ucfirst($service) . " health status (1 for UP, 0 for DOWN)\n";
      $metric_strings[] = "# TYPE {$service}_health gauge\n";
      $metric_strings[] = "drupal_{$service}_health {$status}\n";
    }

    return implode('', $metric_strings);
  }

}
