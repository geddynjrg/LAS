<?php

namespace Drupal\rest_framework\Plugin;

use Drupal\Core\Plugin\PluginBase;

/**
 * Base class for OpenAPI Schema Provider plugins.
 */
abstract class OpenApiSchemaProviderBase extends PluginBase implements OpenApiSchemaProviderInterface {

  /**
   * {@inheritdoc}
   */
  public function getPriority(): int {
    return $this->pluginDefinition['priority'] ?? 0;
  }

  /**
   * {@inheritdoc}
   */
  public function generateExample(string $path, string $method): ?array {
    // Default implementation returns null, meaning no example is available.
    // Child classes should override this method when they want to provide
    // examples.
    return NULL;
  }

}
