<?php

namespace Drupal\tvet_rest\Plugin\rest\resource;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Provides a resource to get content by path alias.
 *
 * @RestResource(
 *     id="tvet_path_resource",
 *     label=@Translation("TVET Path Resource"),
 *     uri_paths={
 *         "canonical": "/api/v1/resolve"
 *     }
 * )
 */
class TvetPathResource extends TvetRestResourceBase {

  /**
   * Responds to GET requests.
   */
  public function get() {
    $request = \Drupal::request();
    $path = $request->headers->get('X-Path');

    // Handle front page request.
    if ($path === '/' || $path === '') {
      $front_page = \Drupal::config('system.site')->get('page.front');

      if ($front_page) {
        // Convert front page path to system path (e.g '/node/1' from 'node/1')
        $path = '/' . ltrim($front_page, '/');
      }
      else {
        throw new NotFoundHttpException('Front page is not configured.');
      }
    }

    // Normalize the path.
    $path = '/' . trim($path, '/');

    // Also support query parameter as fallback.
    if (!$path) {
      $path = $request->query->get('path');
    }

    if (!$path) {
      throw new BadRequestHttpException('Path must be provided via X-Path header or path query parameter');
    }

    $langcode = $this->getRequestedLanguage();

    // Get the internal path.
    $internal_path = $this->aliasManager->getPathByAlias($path, $langcode);

    // Extract entity type and ID from the internal path.
    if (!preg_match('/^\/(?P<entity_type>[^\/]+)\/(?P<entity_id>\d+)$/', $internal_path, $matches)) {
      throw new NotFoundHttpException('Invalid path');
    }

    $entity_type = $matches['entity_type'];
    $entity_id = $matches['entity_id'];

    // Load the entity.
    $entity = \Drupal::entityTypeManager()
      ->getStorage($entity_type)
      ->load($entity_id);

    if (!$entity) {
      throw new NotFoundHttpException('Content not found');
    }

    // Get the translation if available.
    if ($entity->hasTranslation($langcode)) {
      $entity = $entity->getTranslation($langcode);
    }

    // Map the data based on entity type.
    $data = $this->mapEntityData($entity);

    // Get available translations.
    $translations = $this->getEntityTranslations($entity, $internal_path);

    // Build response data.
    $response_data = [
      'data' => $data,
      'meta' => [
        'timestamp' => time(),
        'version' => 'v1',
        'path' => [
          'requested' => $path,
          'internal' => $internal_path,
          'resolved' => TRUE,
        ],
        'language' => [
          'current' => $entity->language()->getId(),
          'default' => $this->languageManager->getDefaultLanguage()->getId(),
          'available' => $translations,
        ],
      ],
    ];

    return $this->createResponse($response_data, $entity);
  }

}
