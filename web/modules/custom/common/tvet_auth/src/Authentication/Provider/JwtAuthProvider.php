<?php

namespace Drupal\tvet_auth\Authentication\Provider;

use Drupal\Core\Authentication\AuthenticationProviderInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\tvet_auth\Service\TvetJwtService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

/**
 * JWT Authentication Provider.
 */
class JwtAuthProvider implements AuthenticationProviderInterface {

  /**
   * The current user service.
   *
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Whether this authentication provider should be applied.
   *
   * @var bool
   */
  protected $isActive;

  /**
   * The JWT service.
   *
   * @var \Drupal\tvet_auth\Service\TvetJwtService
   */
  protected $jwtService;

  /**
   * The logger.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * Constructs a JwtAuthProvider object.
   *
   * @param \Drupal\tvet_auth\Service\TvetJwtService $jwt_service
   *   The JWT service.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Session\AccountProxyInterface $current_user
   *   The current user.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   */
  public function __construct(
    TvetJwtService $jwt_service,
    ConfigFactoryInterface $config_factory,
    EntityTypeManagerInterface $entity_type_manager,
    AccountProxyInterface $current_user,
    LoggerChannelFactoryInterface $logger_factory,
  ) {
    $this->jwtService = $jwt_service;
    $this->isActive = $config_factory->get('tvet_auth.settings')->get('jwt_auth_enabled') ?? TRUE;
    $this->entityTypeManager = $entity_type_manager;
    $this->currentUser = $current_user;
    $this->logger = $logger_factory->get('tvet_auth');
  }

  /**
   * {@inheritdoc}
   */
  public function applies(Request $request) {
    if (!$this->isActive) {
      return FALSE;
    }

    // Try to get the resource configuration from the current path.
    try {
      // Get the path from the request.
      $path = $request->getPathInfo();

      // Get the resolver and find REST resource config for this path.
      $resource_config = NULL;

      // Try to load resource config from route match.
      $route_providers = $this->getRouteProviders();
      $routes = $this->getRoutesByPath($path, $route_providers);

      foreach ($routes as $route) {
        // Check if this is a REST route by looking at the route defaults.
        if (!empty($route->getDefaults()['_rest_resource_config'])) {
          $resource_id = $route->getDefaults()['_rest_resource_config'];

          // Load the resource config entity by ID.
          $resource_config = $this->entityTypeManager->getStorage('rest_resource_config')
            ->load($resource_id);

          break;
        }
      }

      // If we found a resource config, check its authentication providers.
      if ($resource_config) {
        $format = $request->getRequestFormat('json');
        $auth_providers = $resource_config->getAuthenticationProviders($format);

        if (\in_array('jwt_auth', $auth_providers, TRUE)) {
          return TRUE;
        }
      }
    }
    catch (\Exception $e) {
      $this->logger->warning('Error checking REST route: @error', ['@error' => $e->getMessage()]);
    }

    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function authenticate(Request $request) {
    // Get the token from the request.
    $token = $this->getJwtToken($request);

    // If no token provided for a JWT-protected endpoint, throw 401.
    if (!$token) {
      // Return unauthorized with a clear message in JSON format.
      throw new UnauthorizedHttpException(
        'Bearer',
        'Authentication required.'
      );
    }

    try {
      // Validate the token and get the user.
      $user = $this->jwtService->getUserFromToken($token, FALSE);

      if (!$user) {
        throw new UnauthorizedHttpException(
          'Bearer',
          'Invalid or expired JWT token.'
        );
      }

      // When using JWT auth, we'll disable CSRF protection as it's not needed
      // for token-based auth with proper token validation.
      $request->attributes->set('_csrf_request_header_token', FALSE);

      return $user;
    }
    catch (\Exception $e) {
      $this->logger->error('JWT auth error: @message', ['@message' => $e->getMessage()]);

      throw new UnauthorizedHttpException('Bearer', 'Authentication error: ' . $e->getMessage());
    }
  }

  /**
   * Check if the authenticated user has access to the REST resource.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The current request.
   * @param \Drupal\Core\Session\AccountProxyInterface $account
   *   The authenticated account.
   *
   * @throws \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException
   *   Thrown when the user doesn't have sufficient permissions.
   */
  public function checkRestPermissions(Request $request, AccountProxyInterface $account) {
    // Get the route from the request.
    $route = $request->attributes->get('_route');

    // If this is a REST route, check permissions.
    if ($route && strpos($route, 'rest.') === 0) {
      $resource_id = $request->attributes->get('_rest_resource_config')->id();
      $method = strtolower($request->getMethod());

      // Build permission name: 'restful {method} {resource_id}'.
      $permission = 'restful ' . $method . ' ' . $resource_id;

      // Check if user has permission to access this REST endpoint.
      if (!$account->hasPermission($permission)) {
        throw new AccessDeniedHttpException('Access denied. You do not have permission to access this resource.');
      }
    }
  }

  /**
   * Gets the JWT token from the request.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request.
   *
   * @return string|null
   *   The JWT token or NULL if none found.
   */
  protected function getJwtToken(Request $request) {
    // Check Authorization header first (preferred method)
    $auth_header = $request->headers->get('Authorization');

    if ($auth_header) {
      // Extract token from Authorization header (Bearer token)
      if (preg_match('/Bearer\s+(\S+)/i', $auth_header, $matches)) {
        return $matches[1];
      }
    }

    // Check for token in query parameters as fallback.
    if ($request->query->has('access_token')) {
      return $request->query->get('access_token');
    }

    return NULL;
  }

  /**
   * Checks if the request has a valid JWT token.
   *
   * This is used by the JwtCsrfBypassCheck service.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request.
   *
   * @return bool
   *   TRUE if the request has a valid JWT token, FALSE otherwise.
   */
  public function hasValidToken(Request $request) {
    $token = $this->getJwtToken($request);

    if (!$token) {
      return FALSE;
    }

    try {
      // Check if token is valid - this will not throw exceptions.
      $payload = $this->jwtService->getTokenPayload($token);
      return !empty($payload);
    }
    catch (\Exception $e) {
      return FALSE;
    }
  }

  /**
   * Gets the route providers for path matching.
   *
   * @return \Symfony\Component\Routing\RouteProviderInterface[]
   *   An array of route provider objects.
   */
  protected function getRouteProviders() {
    try {
      // Try to get the router.route_provider service.
      $container = \Drupal::getContainer();

      if ($container->has('router.route_provider')) {
        return [$container->get('router.route_provider')];
      }
    }
    catch (\Exception $e) {
      $this->logger->warning('Could not get route provider: @error', ['@error' => $e->getMessage()]);
    }

    return [];
  }

  /**
   * Gets routes that match a path.
   *
   * @param string $path
   *   The path to match.
   * @param array $route_providers
   *   The route providers to check.
   *
   * @return \Symfony\Component\Routing\Route[]
   *   An array of matching routes.
   */
  protected function getRoutesByPath($path, array $route_providers) {
    $routes = [];

    foreach ($route_providers as $route_provider) {
      try {
        // RouteProvider::getRoutesByPattern() might throw an exception.
        foreach ($route_provider->getRoutesByPattern($path) as $route_name => $route) {
          $routes[$route_name] = $route;
        }
      }
      catch (\Exception $e) {
        $this->logger->warning('Error getting routes by pattern: @error', ['@error' => $e->getMessage()]);
      }
    }

    return $routes;
  }

}
