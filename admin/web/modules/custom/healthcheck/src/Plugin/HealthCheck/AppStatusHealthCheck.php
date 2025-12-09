<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Drupal\Component\Plugin\PluginBase;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;

/**
 * Defines a plugin for checking the basic application status.
 *
 * @HealthCheck(
 *     id="app",
 *     label=@Translation("Application Status Check")
 * )
 */
class AppStatusHealthCheck extends PluginBase implements HealthCheckPluginInterface {

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): array {
    $status = 'UP';
    $message = 'Application is running normally.';

    // Handle shell_exec() which can return string|false|null.
    $uptime = shell_exec('uptime -p');
    $uptime_message = $uptime !== FALSE && $uptime !== NULL ? trim($uptime) : 'Uptime not available';

    return [
      'status' => $status,
      'message' => $message,
      'uptime' => $uptime_message,
    ];
  }

}
