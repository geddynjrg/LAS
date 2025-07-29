<?php

namespace Drupal\rest_framework\Service;

use Drupal\Core\Datetime\DrupalDateTime;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\media\MediaInterface;
use Drupal\node\NodeInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\taxonomy\TermInterface;
use Drupal\rest_framework\Plugin\ParagraphMapperManager;

/**
 * Service for mapping Drupal entities to REST-friendly structures.
 */
class RestFrameworkFieldMapper {

  /**
   * The path alias manager.
   *
   * @var \Drupal\path_alias\AliasManagerInterface
   */
  protected $aliasManager;

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
   * The language manager.
   *
   * @var \Drupal\Core\Language\LanguageManagerInterface
   */
  protected $languageManager;

  /**
   * The paragraph mapper plugin manager.
   *
   * @var \Drupal\rest_framework\Plugin\ParagraphMapperManager
   */
  protected $paragraphMapperManager;

  /**
   * Constructs a new RestFrameworkFieldMapper.
   */
  public function __construct(
    ParagraphMapperManager $paragraph_mapper_manager,
    EntityTypeManagerInterface $entity_type_manager,
    FileUrlGeneratorInterface $file_url_generator,
    LanguageManagerInterface $language_manager,
    AliasManagerInterface $alias_manager,
  ) {
    $this->paragraphMapperManager = $paragraph_mapper_manager;
    $this->entityTypeManager = $entity_type_manager;
    $this->fileUrlGenerator = $file_url_generator;
    $this->languageManager = $language_manager;
    $this->aliasManager = $alias_manager;
  }

  /**
   * Cleans a field name by removing the 'field_' prefix.
   */
  public function cleanFieldName(string $field_name): string {
    return str_starts_with($field_name, 'field_') ? substr($field_name, 6) : $field_name;
  }

  /**
   * Maps a field based on its type.
   */
  public function mapFieldByType(string $field_type, $field) {
    // Special handling for field_intake_period.
    if ($field->getName() === 'field_intake_period' && $field_type === 'datetime') {
      return $this->mapIntakePeriodField($field);
    }

    switch ($field_type) {
      case 'entity_reference_revisions':
        if ($field->getFieldDefinition()->getSetting('target_type') === 'paragraph') {
          return $this->mapParagraphField($field);
        }

        return NULL;

      case 'entity_reference':
        return $this->mapEntityReferenceField($field);

      case 'image':
        return $this->mapImageField($field);

      case 'text_long':
      case 'text_with_summary':
        return [
          'value' => $field->value,
          'format' => $field->format,
          'processed' => !empty($field->processed) ? $field->processed : NULL,
        ];

      case 'string':
      case 'string_long':
        return $field->value;

      case 'link':
        return $this->mapLinkField($field);

      case 'datetime':
        return $this->mapDateField($field);

      case 'boolean':
        return (bool) $field->value;

      case 'decimal':
      case 'float':
      case 'integer':
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
          'address_line' => $address->address_line1,
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
        return $field->value;
    }
  }

  /**
   * Maps a node to a REST-friendly array structure.
   */
  public function mapNodeData(NodeInterface $node): array {
    $langcode = $node->language()->getId();
    $path_data = $this->mapPathAlias($node);

    return [
      'id' => $node->id(),
      'type' => $node->bundle(),
      'uuid' => $node->uuid(),
      'title' => $node->getTitle(),
      // 'created' => $this->formatDate($node->getCreatedTime()),
      // 'changed' => $this->formatDate($node->getChangedTime()),
      // 'status' => $node->isPublished(),
      'language' => [
        'code' => $langcode,
        'name' => $this->languageManager->getLanguage($langcode)->getName(),
        'direction' => $this->languageManager->getLanguage($langcode)->getDirection(),
      ],
      // 'author' => $this->mapUserBasic($node->getOwner()),
      'url' => $path_data['url'],
      'path_alias' => $path_data['path_alias'],
      'content' => $this->mapNodeFields($node),
    ];
  }

  /**
   * Maps a short node to a REST-friendly array structure.
   */
  public function mapNodeDataShort(NodeInterface $node): array {
    $path_data = $this->mapPathAlias($node);

    return [
      'id' => $node->id(),
      'type' => $node->bundle(),
      'uuid' => $node->uuid(),
      'title' => $node->getTitle(),
      'path_alias' => $path_data['path_alias'],
    ];
  }

  /**
   * Maps path alias for a node.
   *
   * @param \Drupal\node\NodeInterface $node
   *   The node entity.
   *
   * @return array
   *   Array containing url and path_alias.
   */
  public function mapPathAlias($node): array {
    $url = $node->toUrl()->setAbsolute()->toString();
    $system_path = '/node/' . $node->id();
    $alias = $this->aliasManager->getAliasByPath($system_path);

    return [
      'url' => $url,
      'path_alias' => $alias,
    ];
  }

  /**
   * Maps a taxonomy term to a REST-friendly array structure.
   */
  public function mapTaxonomyTermData(TermInterface $term): string {
    return $term->getName();
  }

  /**
   * Formats a timestamp into an ISO 8601 date string.
   */
  protected function formatDate($timestamp): string {
    return (new DrupalDateTime('@' . $timestamp))->format('c');
  }

  /**
   * Checks if a field is a common Drupal field that should be skipped.
   */
  protected function isCommonField(string $field_name): bool {
    return \in_array($field_name, [
      'nid',
      'uuid',
      'vid',
      'type',
      'title',
      'uid',
      'status',
      'created',
      'changed',
      'langcode',
      'revision_timestamp',
      'revision_uid',
      'promote',
      'sticky',
      'default_langcode',
      'revision_default',
      'revision_translation_affected',
      'menu_link',
      'content_translation_source',
      'content_translation_outdated',
      'content_translation_status',
      'content_translation_created',
      'content_translation_changed',
    ], TRUE);
  }

  /**
   * Maps a date field.
   */
  protected function mapDateField($field): array {
    $dates = [];

    foreach ($field as $item) {
      if ($item->date) {
        $dates[] = $this->formatDate($item->date->getTimestamp());
      }
    }

    return $dates;
  }

  /**
   * Maps the intake period field to month-year format.
   */
  protected function mapIntakePeriodField($field): array {
    $dates = [];

    foreach ($field as $item) {
      if ($item->date) {
        // Format as human-readable month and year (e.g., "January 2023")
        $dates[] = (new DrupalDateTime('@' . $item->date->getTimestamp()))->format('F Y');
      }
    }

    return $dates;
  }

  /**
   * Maps an entity reference field.
   */
  protected function mapEntityReferenceField($field): array {
    $references = [];

    foreach ($field as $item) {
      if ($entity = $item->entity) {
        if ($entity instanceof MediaInterface) {
          $references = $this->mapMediaEntity($entity);

          continue;
        }

        if ($entity instanceof NodeInterface) {
          $references = $this->mapNodeDataShort($entity);

          continue;
        }

        if ($entity instanceof TermInterface) {
          $references[] = $this->mapTaxonomyTermData($entity);

          continue;
        }

        $reference = [
          'id' => $entity->id(),
          'type' => $entity->getEntityTypeId(),
          'bundle' => $entity->bundle(),
          'uuid' => $entity->uuid(),
          'label' => $entity->label(),
        ];

        // Add URL for content entities.
        if (method_exists($entity, 'toUrl')) {
          $reference['url'] = $entity->toUrl()->setAbsolute()->toString();
        }

        $references[] = $reference;
      }
    }

    return $references;
  }

  /**
   * Maps an image field.
   */
  protected function mapImageField($field): array {
    $images = [];

    foreach ($field as $item) {
      if ($file = $item->entity) {
        $images[] = [
          'url' => $this->fileUrlGenerator->generateAbsoluteString($file->getFileUri()),
          'alt' => $item->alt,
          'title' => $item->title,
          'width' => $item->width,
          'height' => $item->height,
          'mime' => $file->getMimeType(),
          'size' => $file->getSize(),
        ];
      }
    }

    return $images;
  }

  /**
   * Maps a link field.
   */
  protected function mapLinkField($field): array {
    $links = [];

    foreach ($field as $item) {
      $links[] = [
        'title' => $item->title,
        'url' => $item->uri,
        'options' => $item->options,
      ];
    }

    return $links;
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
   * Maps node fields based on their types.
   */
  protected function mapNodeFields(NodeInterface $node): array {
    $fields = [];

    foreach ($node->getFields() as $field_name => $field) {
      // Skip common fields that are already mapped.
      if ($this->isCommonField($field_name)) {
        continue;
      }

      $field_type = $field->getFieldDefinition()->getType();
      $clean_name = $this->cleanFieldName($field_name);
      $value = $this->mapFieldByType($field_type, $field);

      if ($value !== NULL && $value !== '') {
        $fields[$clean_name] = $value;
      }
    }

    return $fields;
  }

  /**
   * Maps a paragraph field using the appropriate mapper plugin.
   */
  protected function mapParagraphField($field): array {
    $items = [];

    foreach ($field as $item) {
      if ($paragraph = $item->entity) {
        $mapper = $this->paragraphMapperManager->getMapperForType($paragraph->bundle());

        if ($mapper) {
          $items[] = $mapper->map($paragraph);
        }
        else {
          // Fallback mapping if no specific mapper exists.
          $items[] = [
            'id' => $paragraph->id(),
            'type' => $paragraph->bundle(),
            'uuid' => $paragraph->uuid(),
          ];
        }
      }
    }

    return $items;
  }

  /**
   * Maps basic user information.
   */
  protected function mapUserBasic($user): array {
    if (!$user) {
      return [];
    }

    return [
      'id' => $user->id(),
      'name' => $user->getDisplayName(),
      'uuid' => $user->uuid(),
    ];
  }

}
