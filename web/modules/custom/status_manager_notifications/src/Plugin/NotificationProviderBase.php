<?php

namespace Drupal\status_manager_notifications\Plugin;

use Drupal\Component\Plugin\ConfigurableInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Plugin\PluginBase;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Base class for Notification Provider plugins.
 */
abstract class NotificationProviderBase extends PluginBase implements NotificationProviderInterface, ConfigurableInterface, ContainerFactoryPluginInterface {

  use StringTranslationTrait;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The logger channel.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * The plugin configuration.
   *
   * @var array
   */
  protected $configuration;

  /**
   * Constructs a NotificationProviderBase object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->configFactory = $config_factory;
    $this->logger = $logger_factory->get('status_manager_notifications');
    $this->setConfiguration($configuration);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('config.factory'),
      $container->get('logger.factory')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getType() {
    return $this->pluginDefinition['type'] ?? 'unknown';
  }

  /**
   * {@inheritdoc}
   */
  public function getConfiguration() {
    return $this->configuration;
  }

  /**
   * {@inheritdoc}
   */
  public function setConfiguration(array $configuration) {
    $this->configuration = $configuration + $this->defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration() {
    return [
      'enabled' => TRUE,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function calculateDependencies() {
    return [];
  }

  /**
   * {@inheritdoc}
   */
  public function sendStatusChangeNotification(StatusChangeInterface $status_change) {
    return $this->send($status_change);
  }

  /**
   * {@inheritdoc}
   */
  public function send(StatusChangeInterface $status_change, array $options = []) {
    if (!$this->isConfigured()) {
      return [
        'success' => FALSE,
        'message' => $this->t('@provider is not properly configured.', [
          '@provider' => $this->pluginDefinition['label'],
        ]),
      ];
    }

    // Handle custom message option.
    if (!empty($options['custom_message'])) {
      $recipient = $this->getRecipient($status_change, $options);
      if (!$recipient) {
        return [
          'success' => FALSE,
          'message' => $this->t('No recipient found for notification.'),
        ];
      }
      return $this->sendCustomMessage($recipient, $options['custom_message'], $options);
    }

    // Default implementation using templates.
    return $this->sendTemplatedMessage($status_change, $options);
  }

  /**
   * Sends a templated message for a status change.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $options
   *   Additional options.
   *
   * @return array
   *   Result array with 'success' and 'message' keys.
   */
  abstract protected function sendTemplatedMessage(StatusChangeInterface $status_change, array $options = []);

  /**
   * Gets the recipient for a status change notification.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $options
   *   Additional options.
   *
   * @return string|null
   *   The recipient identifier (email/phone) or NULL if not found.
   */
  abstract protected function getRecipient(StatusChangeInterface $status_change, array $options = []);

  /**
   * {@inheritdoc}
   */
  public function buildConfigurationForm(array $form, FormStateInterface $form_state) {
    $form['enabled'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Enable @provider', ['@provider' => $this->pluginDefinition['label']]),
      '#default_value' => $this->configuration['enabled'],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateConfigurationForm(array &$form, FormStateInterface $form_state) {
    // Subclasses should implement specific validation.
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state) {
    $this->configuration['enabled'] = $form_state->getValue('enabled');
  }

  /**
   * {@inheritdoc}
   */
  public function getHelpText() {
    return $this->pluginDefinition['description'] ?? '';
  }

  /**
   * Logs a notification event.
   *
   * @param string $level
   *   The log level.
   * @param string $message
   *   The log message.
   * @param array $context
   *   The log context.
   */
  protected function log($level, $message, array $context = []) {
    $context['@provider'] = $this->pluginDefinition['label'];
    $this->logger->log($level, $message, $context);
  }

}
