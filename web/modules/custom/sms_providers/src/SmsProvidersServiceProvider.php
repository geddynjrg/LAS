<?php

namespace Drupal\sms_providers;

use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\Core\DependencyInjection\ServiceProviderBase;
use Drupal\sms_providers\DependencyInjection\Compiler\SmsProviderCompilerPass;

/**
 * Service provider for SMS providers module.
 */
class SmsProvidersServiceProvider extends ServiceProviderBase {

  /**
   * {@inheritdoc}
   */
  public function register(ContainerBuilder $container): void {
    parent::register($container);
    $container->addCompilerPass(new SmsProviderCompilerPass());
  }

}
