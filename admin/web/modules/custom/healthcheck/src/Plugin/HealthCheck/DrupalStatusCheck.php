<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Drupal\Component\Plugin\PluginBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Defines a plugin for checking Drupal status.
 *
 * @HealthCheck(
 *     id="drupal_status",
 *     label=@Translation("Drupal Status Check")
 * )
 */
class DrupalStatusCheck extends PluginBase implements HealthCheckPluginInterface, ContainerFactoryPluginInterface {

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static($configuration, $plugin_id, $plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): array {
    $current_version = \Drupal::VERSION;

    return [
      'status' => 'UP',
      'message' => 'Drupal site is running fine.',
      'current_version' => $current_version,
    ];
  }

}
