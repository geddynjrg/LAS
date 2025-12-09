<?php

namespace Drupal\healthcheck;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Plugin\DefaultPluginManager;

/**
 * Provides a plugin manager for health checks.
 */
class HealthCheckPluginManager extends DefaultPluginManager {

  /**
   * Constructs a new HealthCheckPluginManager instance.
   *
   * @param \Traversable $namespaces
   *   An object that contains the root paths keyed by the corresponding
   *   namespace to look for plugin implementations.
   * @param \Drupal\Core\Cache\CacheBackendInterface $cache_backend
   *   Cache backend instance.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $module_handler
   *   The module handler.
   */
  public function __construct($namespaces, CacheBackendInterface $cache_backend, ModuleHandlerInterface $module_handler) {
    parent::__construct('Plugin/HealthCheck', $namespaces, $module_handler, 'Drupal\healthcheck\Plugin\HealthCheckPluginInterface', 'Drupal\healthcheck\Annotation\HealthCheck');
    $this->alterInfo('health_check_info');
    $this->setCacheBackend($cache_backend, 'health_check_plugins');
  }

}
