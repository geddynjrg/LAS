<?php

namespace Drupal\healthcheck\Plugin;

use Drupal\Component\Plugin\PluginInspectionInterface;

/**
 * Defines an interface for Health Check plugins.
 */
interface HealthCheckPluginInterface extends PluginInspectionInterface {

  /**
   * Run the health check and return the result.
   *
   * @return array
   *   The health check result in the format:
   *   [
   *     'status' => 'UP'|'DOWN'|'DISABLED',
   *     'message' => 'Optional message for additional info',
   *   ].
   */
  public function runHealthCheck(): array|string;

}
