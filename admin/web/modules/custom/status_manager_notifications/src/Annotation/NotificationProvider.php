<?php

namespace Drupal\status_manager_notifications\Annotation;

use Drupal\Component\Annotation\Plugin;

/**
 * Defines a Notification Provider plugin annotation object.
 *
 * @see \Drupal\status_manager_notifications\Plugin\NotificationProviderManager
 * @see plugin_api
 *
 * @Annotation
 */
class NotificationProvider extends Plugin {

  /**
   * The plugin ID.
   *
   * @var string
   */
  public $id;

  /**
   * The human-readable name of the notification provider.
   *
   * @var \Drupal\Core\Annotation\Translation
   *
   * @ingroup plugin_translatable
   */
  public $label;

  /**
   * A brief description of the notification provider.
   *
   * @var \Drupal\Core\Annotation\Translation
   *
   * @ingroup plugin_translatable
   */
  public $description;

  /**
   * The notification type this provider handles.
   *
   * @var string
   */
  public $type;

  /**
   * The weight of the provider (for sorting).
   *
   * @var int
   */
  public $weight = 0;

  /**
   * Whether this provider requires configuration.
   *
   * @var bool
   */
  public $configurable = TRUE;

}
