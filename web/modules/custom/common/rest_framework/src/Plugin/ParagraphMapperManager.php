<?php

namespace Drupal\rest_framework\Plugin;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Plugin\DefaultPluginManager;

/**
 * Provides the Paragraph mapper plugin manager.
 */
class ParagraphMapperManager extends DefaultPluginManager {

  /**
   * Constructs a new ParagraphMapperManager object.
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
      'Plugin/ParagraphMapper',
      $namespaces,
      $module_handler,
      'Drupal\rest_framework\Plugin\ParagraphMapperInterface',
      'Drupal\rest_framework\Annotation\ParagraphMapper'
    );

    $this->alterInfo('paragraph_mapper_info');
    $this->setCacheBackend($cache_backend, 'paragraph_mapper_plugins');
  }

  /**
   * Gets a mapper for a specific paragraph type.
   *
   * @param string $paragraph_type
   *   The paragraph type to get a mapper for.
   *
   * @return \Drupal\rest_framework\Plugin\ParagraphMapper\ParagraphMapperInterface|null
   *   The paragraph mapper plugin, or null if none exists.
   */
  public function getMapperForType(string $paragraph_type) {
    foreach ($this->getDefinitions() as $plugin_id => $definition) {
      if ($definition['paragraph_type'] === $paragraph_type) {
        return $this->createInstance($plugin_id);
      }
    }

    return NULL;
  }

}
