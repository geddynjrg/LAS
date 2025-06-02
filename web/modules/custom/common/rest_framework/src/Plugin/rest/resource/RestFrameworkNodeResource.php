<?php

namespace Drupal\rest_framework\Plugin\rest\resource;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Provides a resource to get node content.
 *
 * @RestResource(
 *     id="rest_framework_node_resource",
 *     label=@Translation("REST Framework Node Resource"),
 *     uri_paths={
 *         "canonical": "/api/v1/node/{id}"
 *     }
 * )
 */
class RestFrameworkNodeResource extends RestFrameworkResourceBase {

  /**
   * Responds to GET requests.
   *
   * @param string $id
   *   The ID or path alias of the node.
   *
   * @throws \Symfony\Component\HttpKernel\Exception\NotFoundHttpException
   *
   * @return \Drupal\rest\ResourceResponse
   *   The response containing the node data.
   */
  public function get($id) {
    // Try loading by ID first.
    $node = \Drupal::entityTypeManager()->getStorage('node')->load($id);

    // If not found, try by alias.
    if (!$node && !is_numeric($id)) {
      $path = $this->aliasManager->getPathByAlias('/' . ltrim($id, '/'));

      if (preg_match('/node\/(\d+)/', $path, $matches)) {
        $node = \Drupal::entityTypeManager()->getStorage('node')->load($matches[1]);
      }
    }

    if (!$node) {
      throw new NotFoundHttpException('Node not found');
    }

    // Get the translation if available.
    $langcode = $this->getRequestedLanguage();

    if ($node->hasTranslation($langcode)) {
      $node = $node->getTranslation($langcode);
    }
    else {
      throw new NotFoundHttpException('Node not found');
    }

    $response_data = $this->buildResponseData($node);

    return $this->createResponse($response_data, $node);
  }

}
