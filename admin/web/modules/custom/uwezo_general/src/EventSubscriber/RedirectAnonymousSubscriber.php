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
  public static function getSubscribedEvents(): array {
    // Set high priority to run before routing/controller resolution.
    $events[KernelEvents::REQUEST][] = ['onKernelRequest', 100];

    return $events;
  }

  /**
   * Redirects anonymous users to the login page.
   *
   * @param \Symfony\Component\HttpKernel\Event\RequestEvent $event
   *   The event to process.
   */
  public function onKernelRequest(RequestEvent $event): void {
    $request = $event->getRequest();
    $path_info = $request->getPathInfo();

    // Skip validation for static files.
    if ($this->isStaticFile($path_info)) {
      return;
    }

    // Only process main requests - skip sub-requests (AJAX, ESI, etc.).
    if (!$event->isMainRequest()) {
      return;
    }

    // Only redirect anonymous users.
    if (!$this->currentUser->isAnonymous()) {
      return;
    }

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

    // Check if path is allowed for anonymous access.
    if (\in_array($path_info, $allowed_paths, TRUE) || str_starts_with($path_info, '/api') || str_starts_with($path_info, '/user/reset/')) {
      return;
    }

    // Redirect to login page.
    $url_object = Url::fromRoute('user.login', [], ['absolute' => TRUE]);
    /** @var string $url */
    $url = $url_object->toString();
    $response = new RedirectResponse($url);
    $event->setResponse($response);
  }

  /**
   * Checks if the given path is for a static file.
   *
   * @param string $path
   *   The path to check.
   *
   * @return bool
   *   TRUE if the path is for a static file, FALSE otherwise.
   */
  private function isStaticFile(string $path): bool {
    // Static file extensions that should be publicly accessible.
    $static_extensions = [
      'css', 'js', 'map', 'json',
      'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp',
      'woff', 'woff2', 'ttf', 'eot',
      'pdf', 'txt', 'xml',
    ];

    // Drupal static file directories that should be publicly accessible.
    $static_directories = [
      '/core/',
      '/modules/',
      '/themes/',
      '/sites/',
      '/libraries/',
    ];

    // Check if path starts with known static directories.
    foreach ($static_directories as $directory) {
      if (str_starts_with($path, $directory)) {
        return TRUE;
      }
    }

    // Check if path has a static file extension.
    $path_parts = pathinfo($path);
    if (isset($path_parts['extension'])) {
      $extension = strtolower($path_parts['extension']);
      if (in_array($extension, $static_extensions, TRUE)) {
        return TRUE;
      }
    }

    return FALSE;
  }

}
