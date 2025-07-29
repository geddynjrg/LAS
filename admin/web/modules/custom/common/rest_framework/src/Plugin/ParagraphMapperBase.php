<?php

namespace Drupal\rest_framework\Plugin;

use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Plugin\PluginBase;
use Drupal\file\FileInterface;
use Drupal\media\MediaInterface;
use Drupal\paragraphs\ParagraphInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Base class for paragraph mapper plugins.
 */
abstract class ParagraphMapperBase extends PluginBase implements ParagraphMapperInterface, ContainerFactoryPluginInterface {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The file URL generator.
   *
   * @var \Drupal\Core\File\FileUrlGeneratorInterface
   */
  protected $fileUrlGenerator;

  /**
   * Constructs a ParagraphMapperBase object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\File\FileUrlGeneratorInterface $file_url_generator
   *   The file URL generator.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    EntityTypeManagerInterface $entity_type_manager,
    FileUrlGeneratorInterface $file_url_generator,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->entityTypeManager = $entity_type_manager;
    $this->fileUrlGenerator = $file_url_generator;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('entity_type.manager'),
      $container->get('file_url_generator')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getParagraphType(): string {
    return $this->pluginDefinition['paragraph_type'];
  }

  /**
   * Cleans a field name by removing the 'field_' prefix.
   *
   * @param string $field_name
   *   The field name to clean.
   *
   * @return string
   *   The cleaned field name.
   */
  protected function cleanFieldName(string $field_name): string {
    return str_starts_with($field_name, 'field_') ? substr($field_name, 6) : $field_name;
  }

  /**
   * Maps a date field.
   *
   * @param \Drupal\Core\Field\FieldItemListInterface $field
   *   The date field to map.
   *
   * @return array
   *   The mapped date data.
   */
  protected function mapDateField($field): array {
    $dates = [];

    foreach ($field as $item) {
      if ($item->date) {
        $dates[] = (new DrupalDateTime('@' . $item->date->getTimestamp()))->format('c');
      }
    }

    return $dates;
  }

  /**
   * Maps entity reference fields.
   *
   * @param \Drupal\Core\Field\FieldItemListInterface $field
   *   The field to map.
   *
   * @return array|null
   *   The mapped entity reference data.
   */
  protected function mapEntityReference($field) {
    $references = [];

    foreach ($field as $item) {
      if ($entity = $item->entity) {
        // Handle media entities.
        if ($entity instanceof MediaInterface) {
          $references[] = $this->mapMediaEntity($entity);

          continue;
        }

        // Handle file entities.
        if ($entity instanceof FileInterface) {
          $references[] = $this->mapFileEntity($entity);

          continue;
        }

        // Handle paragraph entities.
        if ($entity instanceof ParagraphInterface) {
          $references[] = $this->mapParagraph($entity);

          continue;
        }

        $reference = [
          'id' => $entity->id(),
          'type' => $entity->getEntityTypeId(),
          'bundle' => $entity->bundle(),
          'label' => $entity->label(),
          'uuid' => $entity->uuid(),
        ];

        if (method_exists($entity, 'toUrl')) {
          $reference['url'] = $entity->toUrl()->setAbsolute()->toString();
        }

        $references[] = $reference;
      }
    }

    return !empty($references) ? $references : NULL;
  }

  /**
   * Maps multiple fields from a paragraph entity.
   *
   * @param \Drupal\paragraphs\ParagraphInterface $paragraph
   *   The paragraph entity.
   * @param array $fields
   *   Array of field names to map.
   *
   * @return array
   *   Array of mapped field values with cleaned field names as keys.
   */
  protected function mapFields(ParagraphInterface $paragraph, array $fields): array {
    $mapped = [];

    foreach ($fields as $field) {
      $value = $this->mapFieldValue($paragraph, $field);

      if ($value !== NULL) {
        $mapped[$this->cleanFieldName($field)] = $value;
      }
    }

    return $mapped;
  }

  /**
   * {@inheritdoc}
   */
  protected function mapFieldValue(ParagraphInterface $paragraph, string $field_name) {
    if (!$paragraph->hasField($field_name)) {
      return NULL;
    }

    $field = $paragraph->get($field_name);

    if ($field->isEmpty()) {
      return NULL;
    }

    // Handle different field types.
    switch ($field->getFieldDefinition()->getType()) {
      case 'entity_reference':
      case 'entity_reference_revisions':
        return $this->mapEntityReference($field);

      case 'text':
      case 'text_long':
      case 'text_with_summary':
        if ($field->getFieldDefinition()->getFieldStorageDefinition()->isMultiple()) {
          return array_map(static function ($item) {
            if (\is_array($item)) {
              return [
                'value' => $item['value'],
                'format' => $item['format'],
                'processed' => !empty($item['processed']) ? $item['processed'] : NULL,
              ];
            }

            return [
              'value' => $item->value,
              'format' => $item->format,
              'processed' => !empty($item->processed) ? $item->processed : NULL,
            ];
          }, $field->getValue());
        }

        return [
          'value' => $field->value,
          'format' => $field->format,
          'processed' => !empty($field->processed) ? $field->processed : NULL,
        ];

      case 'string':
      case 'string_long':
        if ($field->getFieldDefinition()->getFieldStorageDefinition()->isMultiple()) {
          return array_map(static function ($item) {
            return $item['value'];
          }, $field->getValue());
        }

        return $field->value;

      case 'boolean':
        if ($field->getFieldDefinition()->getFieldStorageDefinition()->isMultiple()) {
          return array_map(static function ($item) {
            return (bool) $item['value'];
          }, $field->getValue());
        }

        return (bool) $field->value;

      case 'link':
        return $this->mapLinkField($field);

      case 'datetime':
        return $this->mapDateField($field);

      case 'list_string':
        return $this->mapListStringField($field);

      case 'decimal':
      case 'float':
      case 'integer':
        if ($field->getFieldDefinition()->getFieldStorageDefinition()->isMultiple()) {
          return array_map(static function ($item) {
            return is_numeric($item['value'])
              ? (strpos($item['value'], '.') !== FALSE ? (float) $item['value'] : (int) $item['value'])
              : $item['value'];
          }, $field->getValue());
        }

        return is_numeric($field->value)
          ? (strpos($field->value, '.') !== FALSE ? (float) $field->value : (int) $field->value)
          : $field->value;

      case 'address':
        if ($field->isEmpty()) {
          return NULL;
        }
        $address = $field->first();

        return [
          'country_code' => $address->country_code,
          'administrative_area' => $address->administrative_area,
          'locality' => $address->locality,
          'dependent_locality' => $address->dependent_locality,
          'postal_code' => $address->postal_code,
          'address_line' => $address->address_line,
          'organization' => $address->organization,
        ];

      case 'geofield':
        if ($field->isEmpty()) {
          return NULL;
        }
        $location = $field->first();

        return [
          'latitude' => $location->lat,
          'longitude' => $location->lon,
        ];

      default:
        if ($field->getFieldDefinition()->getFieldStorageDefinition()->isMultiple()) {
          return array_map(static function ($item) {
            return $item['value'];
          }, $field->getValue());
        }

        return $field->value;
    }
  }

  /**
   * Maps a file entity.
   *
   * @param \Drupal\file\FileInterface $file
   *   The file entity to map.
   *
   * @return array
   *   The mapped file data.
   */
  protected function mapFileEntity(FileInterface $file): array {
    return [
      'id' => $file->id(),
      'type' => 'file',
      'name' => $file->getFilename(),
      'url' => $this->fileUrlGenerator->generateAbsoluteString($file->getFileUri()),
      'mime_type' => $file->getMimeType(),
      'size' => $file->getSize(),
      'uuid' => $file->uuid(),
    ];
  }

  /**
   * Maps a link field to an array of links.
   *
   * @param \Drupal\Core\Field\FieldItemListInterface $field
   *   The link field to map.
   *
   * @return array
   *   An array of mapped links.
   */
  protected function mapLinkField($field): array {
    $links = [];
    $base_url = \Drupal::request()->getSchemeAndHttpHost();

    foreach ($field as $item) {
      $url = $item->uri;

      // Handle internal links.
      if (strpos($url, 'internal:') === 0) {
        // Remove the 'internal:' prefix.
        $internal_path = substr($url, 9);

        // If it's a node path, get its alias.
        if (preg_match('/^\/node\/(\d+)$/', $internal_path, $matches)) {
          $alias = \Drupal::service('path_alias.manager')->getAliasByPath($internal_path);
          $url = $base_url . $alias;
        }
        // For other internal paths.
        else {
          $url = $base_url . $internal_path;
        }
      }
      // Handle entity links.
      elseif (strpos($url, 'entity:') === 0) {
        $entity_path = substr($url, 7);
        $url = '/' . $entity_path;
      }

      $links[] = [
        'title' => $item->title,
        'url' => $url,
        'options' => $item->options,
        'is_external' => !str_starts_with($item->uri, 'internal:') && !str_starts_with($item->uri, 'entity:'),
      ];
    }

    return $links;
  }

  /**
   * Maps a list_string field.
   *
   * @param \Drupal\Core\Field\FieldItemListInterface $field
   *   The list_string field to map.
   *
   * @return array|string|null
   *   The mapped list string data.
   */
  protected function mapListStringField($field) {
    if ($field->isEmpty()) {
      return NULL;
    }

    if ($field->getFieldDefinition()->getFieldStorageDefinition()->isMultiple()) {
      $values = [];

      foreach ($field as $item) {
        $values[] = [
          'value' => $item->value,
          'label' => $item->value ? $field->getFieldDefinition()->getSetting('allowed_values')[$item->value] : NULL,
        ];
      }

      return $values;
    }

    return $field->first()->value;
  }

  /**
   * Maps a media entity.
   *
   * @param \Drupal\media\MediaInterface $media
   *   The media entity to map.
   *
   * @return array
   *   The mapped media data.
   */
  protected function mapMediaEntity(MediaInterface $media): array {
    $mapped = [
      'id' => $media->id(),
      'type' => 'media',
      'bundle' => $media->bundle(),
      'name' => $media->label(),
      'uuid' => $media->uuid(),
    ];

    // Get the source field configuration.
    $source_field = $media->getSource()->getConfiguration()['source_field'];

    if ($media->hasField($source_field)) {
      $file_field = $media->get($source_field);

      if (!$file_field->isEmpty() && $file = $file_field->first()->entity) {
        $mapped['url'] = $this->fileUrlGenerator->generateAbsoluteString($file->getFileUri());
        $mapped['mime_type'] = $file->getMimeType();
        $mapped['size'] = $file->getSize();

        // Add image-specific data.
        if ($media->bundle() === 'image' && $media->hasField('field_media_image')) {
          $image = $media->get('field_media_image')->first();

          if ($image) {
            $mapped['alt'] = $image->get('alt')->getValue();
            $mapped['title'] = $image->get('title')->getValue();
            $mapped['width'] = $image->get('width')->getValue();
            $mapped['height'] = $image->get('height')->getValue();
          }
        }
      }
    }

    return $mapped;
  }

  /**
   * Maps a paragraph entity recursively.
   *
   * @param \Drupal\paragraphs\ParagraphInterface $paragraph
   *   The paragraph entity to map.
   * @param string|null $bundle
   *   The bundle of the paragraph entity to map.
   *
   * @return array
   *   The mapped paragraph data.
   */
  protected function mapParagraph(ParagraphInterface $paragraph, $bundle = NULL):
  array {
    // Get the appropriate mapper for this paragraph type.
    $mapper_manager = \Drupal::service('plugin.manager.paragraph_mapper');
    $mapper = $mapper_manager->createInstance($paragraph->bundle());
    if ($bundle) {
      $mapper = $mapper_manager->createInstance($paragraph->bundle());
    }

    if ($mapper) {
      return $mapper->map($paragraph);
    }

    // Fallback mapping if no specific mapper is found.
    return [
      'id' => $paragraph->id(),
      'type' => $paragraph->getType(),
      'bundle' => $paragraph->bundle(),
    ];
  }

}
