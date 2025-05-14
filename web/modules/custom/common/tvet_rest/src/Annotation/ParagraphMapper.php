<?php

namespace Drupal\tvet_rest\Annotation;

use Drupal\Component\Annotation\Plugin;

/**
 * Defines a Paragraph mapper item annotation object.
 *
 * @see \Drupal\tvet_rest\Plugin\ParagraphMapperManager
 * @see plugin_api
 *
 * @Annotation
 */
class ParagraphMapper extends Plugin {

  /**
   * The plugin ID.
   *
   * @var string
   */
  public $id;

  /**
   * The label of the plugin.
   *
   * @var \Drupal\Core\Annotation\Translation
   *
   * @ingroup plugin_translatable
   */
  public $label;

  /**
   * The paragraph type this plugin handles.
   *
   * @var string
   */
  public $paragraph_type;

}
