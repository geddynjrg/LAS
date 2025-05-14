<?php

namespace Drupal\healthcheck\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\healthcheck\HealthCheckPluginManager;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Controller for health check endpoints.
 *
 * Provides endpoints for monitoring system health and status,
 * including checks for various services and dependencies.
 */
class HealthCheckController extends ControllerBase {

  /**
   * The health check plugin manager.
   *
   * @var \Drupal\healthcheck\HealthCheckPluginManager
   */
  protected $pluginManager;

  /**
   * Constructs a HealthCheckController.
   *
   * @param \Drupal\healthcheck\HealthCheckPluginManager $plugin_manager
   *   The health check plugin manager.
   */
  public function __construct(HealthCheckPluginManager $plugin_manager) {
    $this->pluginManager = $plugin_manager;
  }

  /**
   * Healthcheck endpoint.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   A JSON response containing the health check results.
   */
  public function check() {
    $status = [];

    // Get all registered health check plugins.
    $plugins = $this->pluginManager->getDefinitions();

    // Iterate through each plugin and run the health check.
    foreach ($plugins as $plugin_id => $plugin_definition) {
      /** @var \Drupal\healthcheck\Plugin\HealthCheckPluginInterface $plugin */
      $plugin = $this->pluginManager->createInstance($plugin_id);
      $result = $plugin->runHealthCheck();

      // Store the result of each health check by plugin ID.
      $status[$plugin_id] = $result;
    }

    // Return a JSON response with the health check results.
    return new JsonResponse($status, 200, ['Content-Type' => 'application/json']);
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
   * Returns the health check status.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   A JSON response containing the health check results and overall status.
   */
  public function status(): JsonResponse {
    // Add implementation here.
    return new JsonResponse(['status' => 'ok']);
  }

}
