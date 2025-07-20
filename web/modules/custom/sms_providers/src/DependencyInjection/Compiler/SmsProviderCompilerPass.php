<?php

namespace Drupal\sms_providers\DependencyInjection\Compiler;

use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;

/**
 * Compiler pass to automatically register SMS providers.
 */
class SmsProviderCompilerPass implements CompilerPassInterface {

  /**
   * {@inheritdoc}
   */
  public function process(ContainerBuilder $container): void {
    if (!$container->has('sms_providers.sms_service')) {
      return;
    }

    $definition = $container->findDefinition('sms_providers.sms_service');
    $tagged_services = $container->findTaggedServiceIds('sms_provider');

    foreach ($tagged_services as $id => $tags) {
      foreach ($tags as $attributes) {
        $provider_id = $attributes['provider_id'] ?? $id;
        $definition->addMethodCall('addProvider', [$provider_id, new Reference($id)]);
      }
    }
  }

}
