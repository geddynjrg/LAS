<?php

namespace Drupal\tvet_rest\EventSubscriber;

use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Routing\RouteProviderInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Exception subscriber to convert all REST exceptions to JSON format.
 */
class TvetRestExceptionSubscriber implements EventSubscriberInterface {

  /**
   * The logger.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * The route provider.
   *
   * @var \Drupal\Core\Routing\RouteProviderInterface
   */
  protected $routeProvider;

  /**
   * Constructs a TvetRestExceptionSubscriber object.
   *
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   * @param \Drupal\Core\Routing\RouteProviderInterface $route_provider
   *   The route provider.
   */
  public function __construct(
    LoggerChannelFactoryInterface $logger_factory,
    RouteProviderInterface $route_provider,
  ) {
    $this->logger = $logger_factory->get('tvet_rest');
    $this->routeProvider = $route_provider;
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {
    // Set very high priority to catch exceptions early.
    $events[KernelEvents::EXCEPTION][] = ['onException', 1000];
    // Set high priority to ensure proper content negotiation.
    $events[KernelEvents::REQUEST][] = ['onRequest', 300];

    return $events;
  }

  /**
   * Handles exceptions for REST endpoints.
   *
   * @param \Symfony\Component\HttpKernel\Event\ExceptionEvent $event
   *   The exception event.
   */
  public function onException(ExceptionEvent $event) {
    $request = $event->getRequest();

    // Only handle REST requests using our improved detection.
    if (!$this->isRestRequest($request)) {
      return;
    }

    $exception = $event->getThrowable();

    $status_code = Response::HTTP_INTERNAL_SERVER_ERROR;
    $headers = [];

    // Extract status code and headers from HTTP exceptions.
    if ($exception instanceof HttpExceptionInterface) {
      $status_code = $exception->getStatusCode();
      $headers = $exception->getHeaders();
    }

    // Default message.
    $message = $exception->getMessage();

    // Special case for authentication exceptions.
    if ($exception instanceof UnauthorizedHttpException || $status_code === 401) {
      if (!isset($headers['WWW-Authenticate'])) {
        $headers['WWW-Authenticate'] = 'Bearer';
      }
    }
    // Special case for permission exceptions.
    elseif ($exception instanceof AccessDeniedHttpException || $status_code === 403) {
      // Check if a JWT token is present.
      if (!$this->hasJwtToken($request)) {
        // Prioritize auth errors.
        $status_code = Response::HTTP_UNAUTHORIZED;
        $headers['WWW-Authenticate'] = 'Bearer';
        $message = 'Authentication required.';
      }
      else {
        $message = 'Access denied. You do not have permission to access this resource.';
      }
    }

    // Hide potentially sensitive information for server errors.
    if (empty($message) || $status_code >= 500) {
      $message = 'An error occurred. Please try again later.';
    }

    // ALWAYS use application/json for content type.
    $headers['Content-Type'] = 'application/json';

    // Create a JSON response.
    $response = new JsonResponse(
      ['message' => $message],
      $status_code,
      $headers
    );

    // Make sure to expose headers for CORS.
    $response->headers->set('Access-Control-Expose-Headers', 'Content-Type, WWW-Authenticate');

    // Set the response.
    $event->setResponse($response);
  }

  /**
   * Force JSON content negotiation for REST endpoints.
   *
   * @param \Symfony\Component\HttpKernel\Event\RequestEvent $event
   *   The request event.
   */
  public function onRequest(RequestEvent $event) {
    $request = $event->getRequest();

    // Only process for main requests.
    if (!$event->isMainRequest()) {
      return;
    }

    // Use our improved REST request detection.
    if (!$this->isRestRequest($request)) {
      return;
    }

    // Format the request as JSON regardless of what was requested.
    $request->setRequestFormat('json');

    // Forcibly set format attribute for Drupal's content negotiation.
    $request->attributes->set('_format', 'json');

    // Set accept header to application/json if not present.
    if (!$request->headers->has('Accept')) {
      $request->headers->set('Accept', 'application/json');
    }

    // Add accept header even if it's present with */* value.
    if ($request->headers->get('Accept') === '*/*') {
      $request->headers->set('Accept', 'application/json, */*');
    }

    // Force response format to always be JSON for REST routes.
    $request->attributes->set('_controller_negotiation', FALSE);

    // Check for JWT auth by looking for Authorization header.
    if ($this->hasJwtToken($request)) {
      // Set a flag to ensure we handle auth properly.
      $request->attributes->set('_requires_jwt_auth', TRUE);
    }
  }

  /**
   * Checks if a JWT token is present in the request.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request.
   *
   * @return bool
   *   TRUE if a JWT token is present, FALSE otherwise.
   */
  protected function hasJwtToken($request) {
    $auth_header = $request->headers->get('Authorization');

    if ($auth_header && preg_match('/Bearer\s(\S+)/', $auth_header)) {
      return TRUE;
    }

    return $request->query->has('access_token');
  }

  /**
   * Checks if a request is for a REST endpoint.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request.
   *
   * @return bool
   *   TRUE if this is a REST API request, FALSE otherwise.
   */
  protected function isRestRequest($request) {
    // First check: Do we have a _rest_resource_config attribute?
    if ($request->attributes->has('_rest_resource_config')) {
      return TRUE;
    }

    // Is there a route that has _rest_resource_config in its defaults?
    try {
      $path = $request->getPathInfo();

      // Get routes that match this path.
      foreach ($this->routeProvider->getRoutesByPattern($path) as $route) {
        $defaults = $route->getDefaults();

        // Check if this is a REST route.
        if (!empty($defaults['_rest_resource_config'])) {
          return TRUE;
        }
      }
    }
    catch (\Exception $e) {
      $this->logger->warning('Error checking for REST routes: @error', [
        '@error' => $e->getMessage(),
      ]);
    }

    return FALSE;
  }

}
