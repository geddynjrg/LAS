<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Drupal\Component\Plugin\PluginBase;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;

/**
 * Defines a plugin for checking the basic application status.
 *
 * @HealthCheck(
 *     id="status",
 *     label=@Translation("Application Status Check")
 * )
 */
class StatusHealthCheck extends PluginBase implements HealthCheckPluginInterface {

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): string {
    return 'UP';
  }

}
