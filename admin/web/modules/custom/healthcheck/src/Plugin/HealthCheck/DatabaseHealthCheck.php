<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Drupal\Component\Plugin\PluginBase;
use Drupal\Core\Database\Connection;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Defines a plugin for checking database connection.
 *
 * @HealthCheck(
 *     id="database",
 *     label=@Translation("Database Health Check")
 * )
 */
class DatabaseHealthCheck extends PluginBase implements HealthCheckPluginInterface, ContainerFactoryPluginInterface {

  /**
   * The database connection.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * Constructs a new DatabaseHealthCheck.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Database\Connection $database
   *   The database connection.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, Connection $database) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->database = $database;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('database')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): array {
    try {
      // Run a simple query to test the database connection.
      $this->database->query('SELECT 1');

      // Get database connection options.
      $connection_info = $this->database->getConnectionOptions();

      // Fetch the driver from the connection options.
      $driver = $connection_info['driver'] ?? 'unknown';

      return [
        'status' => 'UP',
        'message' => 'Database connection is healthy.',
        'database_type' => $driver,
      ];
    }
    catch (\Exception $e) {
      return [
        'status' => 'DOWN',
        'message' => 'Database connection failed: ' . $e->getMessage(),
      ];
    }
  }

}
