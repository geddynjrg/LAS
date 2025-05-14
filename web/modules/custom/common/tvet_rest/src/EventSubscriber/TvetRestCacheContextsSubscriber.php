<?php

namespace Drupal\tvet_rest\EventSubscriber;

use Drupal\Core\Cache\CacheableResponseInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Adds required cache contexts to REST responses.
 */
class TvetRestCacheContextsSubscriber implements EventSubscriberInterface {

  /**
   * The required cache contexts.
   *
   * @var array
   */
  protected $requiredCacheContexts;

  /**
   * Constructs a new TvetRestCacheContextsSubscriber.
   */
  public function __construct() {
    $this->requiredCacheContexts = [
      'languages:language_interface',
      'theme',
      'user.permissions',
      'path_header',
      'language_header',
      'url.query_args',
      'url.site',
    ];
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {
    return [
      KernelEvents::RESPONSE => ['onResponse', -100],
    ];
  }

  /**
   * Adds cache contexts to the response.
   *
   * @param \Symfony\Component\HttpKernel\Event\ResponseEvent $event
   *   The response event.
   */
  public function onResponse(ResponseEvent $event) {
    $response = $event->getResponse();

    // Only add cache contexts to cacheable responses from our module.
    if ($response instanceof CacheableResponseInterface
        && strpos($event->getRequest()->getPathInfo(), '/api/v1/') === 0) {
      $response->getCacheableMetadata()->addCacheContexts($this->requiredCacheContexts);
    }
  }

}
