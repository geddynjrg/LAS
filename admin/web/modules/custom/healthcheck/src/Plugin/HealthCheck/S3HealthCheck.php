<?php

namespace Drupal\healthcheck\Plugin\HealthCheck;

use Aws\S3\Exception\S3Exception;
use Aws\S3\S3Client;
use Drupal\Component\Plugin\PluginBase;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\healthcheck\Plugin\HealthCheckPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Defines a plugin for checking S3 connection.
 *
 * @HealthCheck(
 *     id="s3",
 *     label=@Translation("S3 Health Check")
 * )
 */
class S3HealthCheck extends PluginBase implements HealthCheckPluginInterface, ContainerFactoryPluginInterface {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * Constructs a new S3HealthCheck.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, ConfigFactoryInterface $config_factory) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->configFactory = $config_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('config.factory')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function runHealthCheck(): array {
    $result = [
      'status' => '',
      'message' => '',
      'hostname' => '',
      'bucket' => '',
    ];

    // Ensure the S3FS module is enabled before checking the connection.
    if (!\Drupal::moduleHandler()->moduleExists('s3fs')) {
      $result['status'] = 'DISABLED';
      $result['message'] = 'S3FS module is not enabled.';

      return $result;
    }

    try {
      // Load S3FS settings from the configuration.
      $s3_config = $this->configFactory->get('s3fs.settings');
      $hostname = $s3_config->get('hostname');
      $bucket = $s3_config->get('bucket');
      $region = $s3_config->get('region');

      // Ensure necessary settings are available.
      if (empty($hostname) || empty($bucket) || empty($region)) {
        $result['status'] = 'DOWN';
        $result['message'] = 'S3 configuration is incomplete.';
      }
      else {
        // Retrieve credentials directly from settings.php.
        $access_key = \Drupal::service('settings')->get('s3fs.access_key');
        $secret_key = \Drupal::service('settings')->get('s3fs.secret_key');

        // Ensure access key and secret key are available.
        if (empty($access_key) || empty($secret_key)) {
          $result['status'] = 'DOWN';
          $result['message'] = 'S3 credentials are missing.';
        }
        else {
          // Create the S3 client with the custom configuration.
          $client = new S3Client([
            'version' => 'latest',
            'region' => $region,
            'endpoint' => $hostname,
            'use_path_style_endpoint' => $s3_config->get('use_path_style_endpoint') ?? TRUE,
            'credentials' => [
              'key' => $access_key,
              'secret' => $secret_key,
            ],
            'http' => [
              'verify' => !($s3_config->get('disable_cert_verify') ?? FALSE),
            ],
          ]);

          // Check the connection to the bucket.
          $client->headBucket(['Bucket' => $bucket]);

          $result['status'] = 'UP';
          $result['message'] = 'S3 connection is healthy.';
          $result['hostname'] = $hostname;
          $result['bucket'] = $bucket;
        }
      }
    }
    catch (S3Exception $e) {
      $result['status'] = 'DOWN';
      $result['message'] = 'S3 connection failed: ' . $e->getMessage();
    }
    catch (\Exception $e) {
      $result['status'] = 'DOWN';
      $result['message'] = 'An error occurred: ' . $e->getMessage();
    }

    return $result;
  }

}
