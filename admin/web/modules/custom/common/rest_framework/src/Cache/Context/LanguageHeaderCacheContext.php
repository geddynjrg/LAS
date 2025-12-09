<?php

namespace Drupal\rest_framework\Cache\Context;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Cache\Context\RequestStackCacheContextBase;

/**
 * Defines the service, for "X-Language" header based caching.
 *
 * Cache context ID: 'language_header'.
 */
class LanguageHeaderCacheContext extends RequestStackCacheContextBase {

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
    $language = $request->headers->get('X-Language');

    if (empty($language)) {
      // Try to get language from query parameter.
      $language = $request->query->get('lang');
    }

    // Normalize language code.
    return !empty($language) ? strtolower($language) : 'default';
  }

  /**
   * {@inheritdoc}
   */
  public static function getLabel() {
    return t('Language Header');
  }

}
