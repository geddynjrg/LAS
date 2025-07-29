<?php

namespace Drupal\healthcheck\Annotation;

use Drupal\Component\Annotation\Plugin;

/**
 * Defines a Health Check plugin annotation object.
 *
 * @Annotation
 */
class HealthCheck extends Plugin {

  /**
   * The plugin ID.
   *
   * @var string
   */
  public $id;

  /**
   * The label of the health check plugin.
   *
   * @var string
   */
  public $label;

}
