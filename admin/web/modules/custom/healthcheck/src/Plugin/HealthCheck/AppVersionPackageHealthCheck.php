<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Drupal\Component\Plugin\PluginBase;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;

/**
 * Defines a plugin for retrieving the current app version from package.json.
 *
 * @HealthCheck(
 *     id="version",
 *     label=@Translation("Application Version (package.json)")
 * )
 */
class AppVersionPackageHealthCheck extends PluginBase implements HealthCheckPluginInterface {

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): array|string {
    // Path to the package.json file.
    $packageJsonPath = DRUPAL_ROOT . '/../package.json';

    // Check if the file exists.
    if (!file_exists($packageJsonPath)) {
      return [
        'status' => 'DOWN',
        'message' => 'package.json file not found.',
      ];
    }

    // Read the content of package.json.
    $packageData = file_get_contents($packageJsonPath);

    if ($packageData === FALSE) {
      return [
        'status' => 'DOWN',
        'message' => 'Could not read package.json file.',
      ];
    }

    $packageJson = json_decode($packageData, TRUE);

    // Check if the version key exists.
    if (isset($packageJson['version'])) {
      return $packageJson['version'];
    }

    return [
      'status' => 'DOWN',
      'message' => 'Version not found in package.json.',
    ];
  }

}
