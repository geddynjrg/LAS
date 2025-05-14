<?php

namespace Drupal\tvet_rest\Plugin;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Plugin\DefaultPluginManager;

/**
 * Plugin manager for OpenAPI Schema Provider plugins.
 */
class OpenApiSchemaProviderManager extends DefaultPluginManager {

  /**
   * Constructs a OpenApiSchemaProviderManager object.
   *
   * @param \Traversable $namespaces
   *   An object that implements \Traversable which contains the root paths
   *   keyed by the corresponding namespace to look for plugin implementations.
   * @param \Drupal\Core\Cache\CacheBackendInterface $cache_backend
   *   Cache backend instance to use.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $module_handler
   *   The module handler to invoke the alter hook with.
   */
  public function __construct(\Traversable $namespaces, CacheBackendInterface $cache_backend, ModuleHandlerInterface $module_handler) {
    parent::__construct(
      'Plugin/OpenApiSchemaProvider',
      $namespaces,
      $module_handler,
      'Drupal\tvet_rest\Plugin\OpenApiSchemaProviderInterface',
      'Drupal\tvet_rest\Annotation\OpenApiSchemaProvider'
    );

    $this->alterInfo('tvet_rest_openapi_schema_provider_info');
    $this->setCacheBackend($cache_backend, 'tvet_rest_openapi_schema_provider_plugins');
  }

  /**
   * Gets schema providers sorted by priority.
   *
   * @return \Drupal\tvet_rest\Plugin\OpenApiSchemaProviderInterface[]
   *   Array of sorted schema provider plugins.
   */
  public function getSortedDefinitions() {
    $definitions = $this->getDefinitions();
    uasort($definitions, function ($a, $b) {
      // Sort by priority, higher values get processed later.
      return $a['priority'] <=> $b['priority'];
    });
    return $definitions;
  }

  /**
   * Gets all schema provider plugins sorted by priority.
   *
   * Higher priority will be processed later, allowing for schema overrides.
   *
   * @return \Drupal\tvet_rest\Plugin\OpenApiSchemaProviderInterface[]
   *   An array of instantiated schema provider plugins, sorted by priority.
   */
  public function getSortedProviders() {
    $definitions = $this->getDefinitions();
    $providers = [];

    foreach ($definitions as $plugin_id => $definition) {
      $providers[$plugin_id] = $this->createInstance($plugin_id);
    }

    // Sort by plugin priority (higher priority means processed later).
    uasort($providers, function (OpenApiSchemaProviderInterface $a, OpenApiSchemaProviderInterface $b) {
      return $a->getPriority() <=> $b->getPriority();
    });

    return $providers;
  }

}
