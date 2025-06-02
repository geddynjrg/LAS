<?php

namespace Drupal\api_auth\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\user\UserInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Service for JWT token handling in API Auth.
 */
class ApiJwtService {

  /**
   * JWT algorithm.
   *
   * @var string
   */
  protected $algorithm = 'HS256';

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Access token expiration time (in seconds).
   *
   * @var int
   */
  protected $expiration;

  /**
   * Refresh token expiration time (in seconds).
   *
   * @var int
   */
  protected $refreshExpiration;

  /**
   * The JWT refresh secret key.
   *
   * @var string
   */
  protected $refreshSecret;

  /**
   * The JWT secret key.
   *
   * @var string
   */
  protected $secret;

  /**
   * The token storage service.
   *
   * @var \Drupal\api_auth\Service\TokenStorageService
   */
  protected $tokenStorage;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $config;

  /**
   * Constructs a new ApiJwtService.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\api_auth\Service\TokenStorageService $token_storage
   *   The token storage service.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    EntityTypeManagerInterface $entity_type_manager,
    TokenStorageService $token_storage,
  ) {
    $this->config = $config_factory->get('api_auth.settings');
    $this->secret = $this->config->get('jwt_secret') ?: $this->generateSecret();
    $this->refreshSecret = $this->config->get('jwt_refresh_secret') ?: $this->generateSecret();
    // Default: 1 hour.
    $this->expiration = $this->config->get('jwt_expiration') ?: 3600;
    // Default: 30 days.
    $this->refreshExpiration = $this->config->get('jwt_refresh_expiration') ?: 2592000;
    $this->entityTypeManager = $entity_type_manager;
    $this->tokenStorage = $token_storage;

    // Purge expired tokens from storage.
    $this->tokenStorage->purgeExpiredTokens();
  }

  /**
   * Backward compatibility method.
   */
  public function generateToken(UserInterface $user) {
    $tokens = $this->generateTokens($user);

    return $tokens['access_token'];
  }

  /**
   * Generates JWT tokens for a user.
   *
   * @param \Drupal\user\UserInterface $user
   *   The user entity.
   *
   * @return array
   *   An array containing access_token and refresh_token.
   */
  public function generateTokens(UserInterface $user) {
    // Remove all existing tokens for the user.
    $this->removeAllUserTokens($user);
    // Get the current timestamp.
    $issued_at = time();

    // Generate access token payload.
    $access_payload = [
      'iat' => $issued_at,
      'exp' => $issued_at + $this->expiration,
      'uid' => $user->id(),
      'roles' => $user->getRoles(),
      'jti' => $this->generateJti(),
      'type' => 'access',
    ];

    // Generate refresh token payload.
    $refresh_payload = [
      'iat' => $issued_at,
      'exp' => $issued_at + $this->refreshExpiration,
      'uid' => $user->id(),
      'jti' => $this->generateJti(),
      'type' => 'refresh',
    ];

    // Encode tokens.
    $access_token = JWT::encode($access_payload, $this->secret, $this->algorithm);
    $refresh_token = JWT::encode($refresh_payload, $this->refreshSecret, $this->algorithm);

    // Store tokens in database.
    $access_token_id = $this->tokenStorage->storeToken($access_token, $access_payload, 'access');
    $this->tokenStorage->storeToken($refresh_token, $refresh_payload, 'refresh', $access_token_id);

    return [
      'access_token' => $access_token,
      'refresh_token' => $refresh_token,
      'expires_in' => $this->expiration,
    ];
  }

  /**
   * Returns the access token expiration time in seconds.
   *
   * @return int
   *   The expiration time in seconds.
   */
  public function getAccessTokenExpiration() {
    return $this->expiration;
  }

  /**
   * Returns the refresh token expiration time in seconds.
   *
   * @return int
   *   The expiration time in seconds.
   */
  public function getRefreshTokenExpiration() {
    return $this->refreshExpiration;
  }

  /**
   * Gets token payload without full validation (accessing JTI during logout).
   *
   * @param string $token
   *   The JWT token.
   * @param bool $is_refresh
   *   Whether this is a refresh token.
   *
   * @return array|bool
   *   The decoded token payload if decoding succeeded, FALSE otherwise.
   */
  public function getTokenPayload($token, $is_refresh = FALSE) {
    try {
      $secret = $is_refresh ? $this->refreshSecret : $this->secret;
      $decoded = JWT::decode($token, new Key($secret, $this->algorithm));

      return (array) $decoded;
    }
    catch (\Exception $e) {
      return FALSE;
    }
  }

  /**
   * Gets a user from a token.
   *
   * @param string $token
   *   The JWT token.
   * @param bool $is_refresh
   *   Whether this is a refresh token.
   *
   * @return \Drupal\user\UserInterface|null
   *   The user entity or NULL if invalid.
   */
  public function getUserFromToken($token, $is_refresh = FALSE) {
    $payload = $this->validateToken($token, $is_refresh);

    if (!$payload || empty($payload['uid'])) {
      return NULL;
    }

    try {
      $user_storage = $this->entityTypeManager->getStorage('user');
      /** @var \Drupal\user\UserInterface $user */
      $user = $user_storage->load($payload['uid']);

      return $user && $user->isActive() ? $user : NULL;
    }
    catch (\Exception $e) {
      return NULL;
    }
  }

  /**
   * Refreshes an access token using a valid refresh token.
   *
   * @param string $refresh_token
   *   The refresh token.
   *
   * @return array|null
   *   An array containing new tokens or NULL if invalid.
   */
  public function refreshTokens($refresh_token) {
    $payload = $this->validateToken($refresh_token, TRUE);

    if (!$payload) {
      return NULL;
    }

    try {
      $user_storage = $this->entityTypeManager->getStorage('user');
      /** @var \Drupal\user\UserInterface $user */
      $user = $user_storage->load($payload['uid']);

      if (!$user || !$user->isActive()) {
        return NULL;
      }

      // Before removing, log which token is being used for refresh.
      \Drupal::logger('api_auth')->info(
        'Processing refresh token JTI: @jti for user @uid',
        [
          '@jti' => $payload['jti'],
          '@uid' => $payload['uid'],
        ]
      );

      // Remove the entire token family (access token + refresh token)
      $removed = $this->tokenStorage->removeTokenFamily($payload['jti']);

      // Log the token removal.
      \Drupal::logger('api_auth')->info(
        'Removed @count tokens during refresh operation. Token JTI: @jti, User: @uid',
        [
          '@count' => $removed,
          '@jti' => $payload['jti'],
          '@uid' => $payload['uid'],
        ]
      );

      // Generate new tokens.
      return $this->generateTokens($user);
    }
    catch (\Exception $e) {
      \Drupal::logger('api_auth')->error(
        'Error refreshing tokens: @error',
        ['@error' => $e->getMessage()]
      );

      return NULL;
    }
  }

  /**
   * Removes all tokens for a user.
   *
   * @param \Drupal\user\UserInterface $user
   *   The user.
   *
   * @return int
   *   The number of tokens removed.
   */
  public function removeAllUserTokens(UserInterface $user) {
    try {
      // Get all the user's active tokens.
      $database = \Drupal::database();
      $token_ids = $database->select('api_active_tokens', 't')
        ->fields('t', ['id'])
        ->condition('user_id', $user->id())
        ->execute()
        ->fetchCol();

      if (empty($token_ids)) {
        return 0;
      }

      // Delete all tokens.
      $deleted = $database->delete('api_active_tokens')
        ->condition('id', $token_ids, 'IN')
        ->execute();

      \Drupal::logger('api_auth')->info(
        'Removed @count tokens for user @uid',
        [
          '@count' => $deleted,
          '@uid' => $user->id(),
        ]
      );

      return $deleted;
    }
    catch (\Exception $e) {
      \Drupal::logger('api_auth')->error(
        'Error removing all user tokens: @error',
        ['@error' => $e->getMessage()]
      );

      return 0;
    }
  }

  /**
   * Removes a token and all tokens in its family (access+refresh).
   *
   * @param string $token
   *   The token to remove.
   * @param bool $is_refresh
   *   Whether this is a refresh token.
   *
   * @return int
   *   The number of tokens removed.
   */
  public function removeTokenSession($token, $is_refresh = FALSE) {
    try {
      // First decode the token.
      $payload = $this->getTokenPayload($token, $is_refresh);

      if (!$payload || empty($payload['jti'])) {
        return 0;
      }

      // Remove the token family.
      return $this->tokenStorage->removeTokenFamily($payload['jti']);
    }
    catch (\Exception $e) {
      \Drupal::logger('api_auth')->error(
        'Error removing token session: @error',
        ['@error' => $e->getMessage()]
      );

      return 0;
    }
  }

  /**
   * Revokes all tokens for a user.
   *
   * @param \Drupal\user\UserInterface $user
   *   The user.
   *
   * @return bool
   *   TRUE if successful, FALSE otherwise.
   */
  public function revokeUserTokens(UserInterface $user) {
    // Revoke tokens in the storage service.
    $count = $this->tokenStorage->revokeUserTokens($user->id());

    \Drupal::logger('api_auth')->info(
      'Revoked @count tokens for user @uid',
      [
        '@count' => $count,
        '@uid' => $user->id(),
      ]
    );

    return $count > 0;
  }

  /**
   * Validates a JWT token.
   *
   * @param string $token
   *   The JWT token to validate.
   * @param bool $is_refresh
   *   Whether this is a refresh token.
   *
   * @return array|bool
   *   The decoded token payload if valid, FALSE otherwise.
   */
  public function validateToken($token, $is_refresh = FALSE) {
    try {
      $secret = $is_refresh ? $this->refreshSecret : $this->secret;
      $decoded = JWT::decode($token, new Key($secret, $this->algorithm));

      // Convert to array for easier handling.
      $payload = (array) $decoded;

      // Check if token is expired.
      if (isset($payload['exp']) && $payload['exp'] < time()) {
        return FALSE;
      }

      // For refresh tokens, check that token type is correct.
      if ($is_refresh && (!isset($payload['type']) || $payload['type'] !== 'refresh')) {
        return FALSE;
      }

      // For access tokens, check that token type is correct.
      if (!$is_refresh && (!isset($payload['type']) || $payload['type'] !== 'access')) {
        return FALSE;
      }

      // Check if token has a JTI.
      if (empty($payload['jti'])) {
        return FALSE;
      }

      // Check if token is valid in storage.
      if (!$this->tokenStorage->isTokenValid($payload['jti'])) {
        return FALSE;
      }

      // Apply strict validation if enabled in settings.
      if ($this->config->get('jwt_strict_validation')) {
        if (!$this->validateTokenClaims($payload, $is_refresh)) {
          return FALSE;
        }
      }

      return $payload;
    }
    catch (\Exception $e) {
      return FALSE;
    }
  }

  /**
   * Generate a unique JWT ID.
   *
   * @return string
   *   A unique identifier for the JWT.
   */
  protected function generateJti() {
    return bin2hex(random_bytes(16));
  }

  /**
   * Generate a random secret key.
   *
   * @return string
   *   A random 256-bit key encoded as base64.
   */
  protected function generateSecret() {
    return base64_encode(random_bytes(32));
  }

  /**
   * Performs strict validation of token claims.
   *
   * @param array $payload
   *   The token payload to validate.
   * @param bool $is_refresh
   *   Whether this is a refresh token.
   *
   * @return bool
   *   TRUE if the token passes strict validation, FALSE otherwise.
   */
  protected function validateTokenClaims(array $payload, $is_refresh = FALSE) {
    // Check for required claims.
    $required_claims = ['jti', 'iat', 'exp', 'uid', 'type'];

    if (!$is_refresh) {
      $required_claims[] = 'roles';
    }

    foreach ($required_claims as $claim) {
      if (empty($payload[$claim])) {
        return FALSE;
      }
    }

    // Validate issued at time.
    if (!is_numeric($payload['iat']) || $payload['iat'] > time()) {
      return FALSE;
    }

    // Validate expiration time.
    if (!is_numeric($payload['exp']) || $payload['exp'] <= $payload['iat']) {
      return FALSE;
    }

    // Validate user ID.
    if (!is_numeric($payload['uid']) || $payload['uid'] <= 0) {
      return FALSE;
    }

    // Token type validation.
    $valid_types = ['access', 'refresh'];

    if (!\in_array($payload['type'], $valid_types, TRUE)) {
      return FALSE;
    }

    // Specific validation for token types.
    if ($is_refresh && $payload['type'] !== 'refresh') {
      return FALSE;
    }

    if (!$is_refresh && $payload['type'] !== 'access') {
      return FALSE;
    }

    // Additional validation for access tokens.
    if (!$is_refresh && (!isset($payload['roles']) || !\is_array($payload['roles']))) {
      return FALSE;
    }

    return TRUE;
  }

}
