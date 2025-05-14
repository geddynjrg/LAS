<?php

namespace Drupal\tvet_auth\Access;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Access\CsrfRequestHeaderAccessCheck;
use Drupal\Core\Access\CsrfTokenGenerator;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Session\SessionConfigurationInterface;
use Drupal\tvet_auth\Authentication\Provider\JwtAuthProvider;
use Symfony\Component\HttpFoundation\Request;

/**
 * Extends the CSRF access check to bypass it when using JWT authentication.
 */
class JwtCsrfDecorator extends CsrfRequestHeaderAccessCheck {

  /**
   * The JWT auth provider.
   *
   * @var \Drupal\tvet_auth\Authentication\Provider\JwtAuthProvider
   */
  protected $jwtAuthProvider;

  /**
   * Constructs a new JwtCsrfDecorator.
   *
   * @param \Drupal\Core\Session\SessionConfigurationInterface $session_configuration
   *   The session configuration.
   * @param \Drupal\Core\Access\CsrfTokenGenerator $csrf_token
   *   The token generator.
   * @param \Drupal\tvet_auth\Authentication\Provider\JwtAuthProvider $jwt_auth_provider
   *   The JWT authentication provider.
   */
  public function __construct(
    SessionConfigurationInterface $session_configuration,
    CsrfTokenGenerator $csrf_token,
    JwtAuthProvider $jwt_auth_provider,
  ) {
    $this->jwtAuthProvider = $jwt_auth_provider;
    parent::__construct($session_configuration, $csrf_token);
  }

  /**
   * {@inheritdoc}
   */
  public function access(Request $request, AccountInterface $account) {
    $method = $request->getMethod();

    // Read-only operations are always allowed.
    if (in_array($method, ['GET', 'HEAD', 'OPTIONS', 'TRACE'], TRUE)) {
      return AccessResult::allowed();
    }

    // Check if this is a REST resource that uses JWT authentication.
    $resource_config = $request->attributes->get('_rest_resource_config', FALSE);
    if ($resource_config) {
      $format = $request->getRequestFormat('json');
      $auth_providers = $resource_config->getAuthenticationProviders($format);

      // If JWT is configured as an auth provider for this resource and we
      // have a valid token.
      if (in_array('jwt_auth', $auth_providers, TRUE) && $this->jwtAuthProvider->hasValidToken($request)) {
        // If JWT authentication is being used, bypass CSRF check.
        return AccessResult::allowed()->setCacheMaxAge(0);
      }
    }
    // For non-REST requests, check if JWT is being used.
    elseif ($this->jwtAuthProvider->hasValidToken($request)) {
      return AccessResult::allowed()->setCacheMaxAge(0);
    }

    // Otherwise, delegate to the original CSRF check implementation.
    return parent::access($request, $account);
  }

}
