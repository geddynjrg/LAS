<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Drupal\Component\Plugin\PluginBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;
use Drupal\redis\ClientFactory;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Defines a plugin for checking Redis connection.
 *
 * @HealthCheck(
 *     id="redis",
 *     label=@Translation("Redis Health Check")
 * )
 */
class RedisHealthCheck extends PluginBase implements HealthCheckPluginInterface, ContainerFactoryPluginInterface {

  /**
   * The Redis client factory.
   *
   * @var \Drupal\redis\ClientFactory
   */
  protected $redisClientFactory;

  /**
   * Constructs a new RedisHealthCheck.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\redis\ClientFactory $redis_client_factory
   *   The Redis client factory.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, ClientFactory $redis_client_factory) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->redisClientFactory = $redis_client_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('redis.factory')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): array {
    try {
      $client = $this->redisClientFactory->getClient();
      $client->ping();

      $cache_prefix = \Drupal::service('settings')->get('cache_prefix');

      return [
        'status' => 'UP',
        'message' => 'Redis connection is healthy.',
        'cache_prefix' => $cache_prefix,
      ];
    }
    catch (\Exception $e) {
      return [
        'status' => 'DOWN',
        'message' => 'Redis connection failed: ' . $e->getMessage(),
      ];
    }
  }

}
