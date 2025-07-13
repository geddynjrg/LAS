<?php

namespace Drupal\sms_providers\Annotation;

use Drupal\Component\Annotation\Plugin;
use Drupal\Core\Annotation\Translation;

/**
 * Defines an SMS Provider plugin annotation object.
 *
 * @see \Drupal\sms_providers\Plugin\SmsProviderManager
 * @see plugin_api
 *
 * @Annotation
 */
class SmsProvider extends Plugin {

  /**
   * The plugin ID.
   */
  public string $id;

  /**
   * The human-readable name of the SMS provider.
   *
   * @ingroup plugin_translatable
   */
  public Translation $label;

}
