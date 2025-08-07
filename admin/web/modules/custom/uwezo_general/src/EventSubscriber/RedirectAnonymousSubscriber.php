<?php

namespace Drupal\uwezo_general\EventSubscriber;

use Drupal\Core\Routing\UrlGeneratorInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\Core\Url;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Event subscriber to redirect anonymous users to the login page.
 */
class RedirectAnonymousSubscriber implements EventSubscriberInterface {

  /**
   * The current user.
   *
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The URL generator.
   *
   * @var \Drupal\Core\Routing\UrlGeneratorInterface
   */
  protected $urlGenerator;

  /**
   * Constructs a new RedirectAnonymousSubscriber.
   *
   * @param \Drupal\Core\Session\AccountProxyInterface $current_user
   *   The current user.
   * @param \Drupal\Core\Routing\UrlGeneratorInterface $url_generator
   *   The URL generator.
   */
  public function __construct(AccountProxyInterface $current_user, UrlGeneratorInterface $url_generator) {
    $this->currentUser = $current_user;
    $this->urlGenerator = $url_generator;
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {
    $events[KernelEvents::REQUEST][] = ['onKernelRequest'];

    return $events;
  }

  /**
   * Redirects anonymous users to the login page.
   *
   * @param \Symfony\Component\HttpKernel\Event\RequestEvent $event
   *   The event to process.
   */
  public function onKernelRequest(RequestEvent $event) {
    $request = $event->getRequest();

    $allowed_paths = [
      '/user/login',
      '/user/logout',
      '/user/password',
      '/user/register',
      '/healthz',
      '/metrics/web',
      '/docs',
      '/api/docs',
      '/api/docs/spec',
      '/api/docs/swagger',
      '/api/docs/json',
    ];

    $path_info = $request->getPathInfo();

    if ($this->currentUser->isAnonymous() && !\in_array($path_info, $allowed_paths, TRUE) && !str_starts_with($path_info, '/api') && !str_starts_with($path_info, '/user/reset/')) {
      $url_object = Url::fromRoute('user.login', [], ['absolute' => TRUE]);
      /** @var string $url */
      $url = $url_object->toString();
      $response = new RedirectResponse($url);
      $event->setResponse($response);
    }
  }

}
