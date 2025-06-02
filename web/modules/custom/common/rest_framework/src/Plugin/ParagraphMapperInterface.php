<?php

namespace Drupal\rest_framework\Plugin;

use Drupal\paragraphs\ParagraphInterface;

/**
 * Interface for paragraph mapper plugins.
 */
interface ParagraphMapperInterface {

  /**
   * Gets the paragraph type this mapper supports.
   *
   * @return string
   *   The paragraph type machine name.
   */
  public function getParagraphType(): string;

  /**
   * Maps a paragraph entity to an array structure.
   *
   * @param \Drupal\paragraphs\ParagraphInterface $paragraph
   *   The paragraph entity to map.
   *
   * @return array
   *   The mapped data array.
   */
  public function map(ParagraphInterface $paragraph): array;

  /**
   * Provides an example structure for OpenAPI documentation.
   *
   * @return array|null
   *   An associative array representing the JSON structure of an example
   *   for this paragraph type, or NULL if no example is provided.
   *   The structure should match the output of the map() method.
   *   Must include the 'block_type' key.
   */
  public function getOpenApiExample(): ?array;

}
