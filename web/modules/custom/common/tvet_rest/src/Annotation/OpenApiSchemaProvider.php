<?php

namespace Drupal\tvet_rest\Annotation;

use Drupal\Component\Annotation\Plugin;

/**
 * Defines an OpenAPI Schema Provider item annotation object.
 *
 * @see \Drupal\tvet_rest\Plugin\OpenApiSchemaProviderManager
 * @see plugin_api
 *
 * @Annotation
 */
class OpenApiSchemaProvider extends Plugin {

  /**
   * The plugin ID.
   *
   * @var string
   */
  public $id;

  /**
   * The label of the plugin.
   *
   * @var \Drupal\Core\Annotation\Translation
   *
   * @ingroup plugin_translatable
   */
  public $label;

  /**
   * The priority of the plugin (higher priority = processed later).
   *
   * @var int
   */
  public $priority = 0;

}
