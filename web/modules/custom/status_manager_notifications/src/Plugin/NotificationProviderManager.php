<?php

namespace Drupal\status_manager_notifications\Plugin;

use Drupal\Core\Plugin\DefaultPluginManager;
use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;

/**
 * Provides the Notification Provider plugin manager.
 */
class NotificationProviderManager extends DefaultPluginManager {

  /**
   * Constructs a new NotificationProviderManager object.
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
      'Plugin/NotificationProvider',
      $namespaces,
      $module_handler,
      'Drupal\status_manager_notifications\Plugin\NotificationProviderInterface',
      'Drupal\status_manager_notifications\Annotation\NotificationProvider'
    );

    $this->alterInfo('status_manager_notification_provider_info');
    $this->setCacheBackend($cache_backend, 'status_manager_notification_provider_plugins');
  }

  /**
   * Gets all available providers grouped by type.
   *
   * @return array
   *   An associative array of providers grouped by type.
   */
  public function getProvidersByType() {
    $providers = [];
    foreach ($this->getDefinitions() as $plugin_id => $definition) {
      $type = $definition['type'] ?? 'other';
      $providers[$type][$plugin_id] = $definition;
    }
    return $providers;
  }

  /**
   * Gets providers for a specific notification type.
   *
   * @param string $type
   *   The notification type (email, sms, etc.).
   *
   * @return array
   *   An array of provider definitions.
   */
  public function getProvidersForType($type) {
    $providers = [];
    foreach ($this->getDefinitions() as $plugin_id => $definition) {
      if (($definition['type'] ?? '') === $type) {
        $providers[$plugin_id] = $definition;
      }
    }

    // Sort by weight.
    uasort($providers, function ($a, $b) {
      return ($a['weight'] ?? 0) <=> ($b['weight'] ?? 0);
    });

    return $providers;
  }

}
