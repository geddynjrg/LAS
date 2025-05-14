<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Drupal\Component\Plugin\PluginBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Queue\QueueFactory;
use Drupal\Core\Queue\QueueWorkerManagerInterface;
use Drupal\Core\State\StateInterface;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Defines a plugin for checking the cron job status.
 *
 * @HealthCheck(
 *     id="cron",
 *     label=@Translation("Cron Health Check")
 * )
 */
class CronHealthCheck extends PluginBase implements HealthCheckPluginInterface, ContainerFactoryPluginInterface {

  /**
   * The queue factory service.
   *
   * @var \Drupal\Core\Queue\QueueFactory
   */
  protected $queueFactory;

  /**
   * The queue worker manager service.
   *
   * @var \Drupal\Core\Queue\QueueWorkerManagerInterface
   */
  protected $queueWorkerManager;

  /**
   * The state service.
   *
   * @var \Drupal\Core\State\StateInterface
   */
  protected $state;

  /**
   * Constructs a new CronHealthCheck.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\State\StateInterface $state
   *   The state service.
   * @param \Drupal\Core\Queue\QueueFactory $queue_factory
   *   The queue factory service.
   * @param \Drupal\Core\Queue\QueueWorkerManagerInterface $queue_worker_manager
   *   The queue worker manager service.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, StateInterface $state, QueueFactory $queue_factory, QueueWorkerManagerInterface $queue_worker_manager) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->state = $state;
    $this->queueFactory = $queue_factory;
    $this->queueWorkerManager = $queue_worker_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('state'),
      $container->get('queue'),
      $container->get('plugin.manager.queue_worker')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): array {
    $last_cron_run = $this->state->get('system.cron_last');
    $cron_in_progress = $this->state->get('system.cron_in_progress', FALSE);
    $time_since_last_run = time() - $last_cron_run;

    // Get all queues and their status.
    $queues = [];

    foreach ($this->queueWorkerManager->getDefinitions() as $queue_name => $definition) {
      $queue = $this->queueFactory->get($queue_name);
      $number_of_items = $queue->numberOfItems();
      $queues[$queue_name] = [
        'items' => $number_of_items,
        'status' => $number_of_items > 0 ? 'Pending' : 'Empty',
      ];
    }

    return [
      'last_run' => $last_cron_run,
      'time_since_last_run' => $time_since_last_run,
      'cron_in_progress' => $cron_in_progress ? 'In Progress' : 'Idle',
      'queues' => $queues,
    ];
  }

}
