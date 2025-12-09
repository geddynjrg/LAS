<?php

namespace Drupal\rest_framework\Cache\Context;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Cache\Context\RequestStackCacheContextBase;

/**
 * Defines the service, for "X-Path" header based caching.
 *
 * Cache context ID: 'path_header'.
 */
class PathHeaderCacheContext extends RequestStackCacheContextBase {

  /**
   * {@inheritdoc}
   */
  public function getCacheableMetadata() {
    return new CacheableMetadata();
  }

  /**
   * {@inheritdoc}
   */
  public function getContext() {
    $request = $this->requestStack->getCurrentRequest();
    $path = $request->headers->get('X-Path');

    // If no path is provided, use the current request path.
    if (empty($path)) {
      return 'none';
    }

    // Return the normalized path as the context.
    return '/' . trim($path, '/');
  }

  /**
   * {@inheritdoc}
   */
  public static function getLabel() {
    return t('Path Header');
  }

}
