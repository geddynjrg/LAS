<?php

namespace Drupal\api_auth\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database\Connection;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Service for storing and managing JWT tokens.
 */
class TokenStorageService {

  /**
   * Configuration factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The database connection.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * The logger.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * The request stack.
   *
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  protected $requestStack;

  /**
   * Token limit per user.
   *
   * @var int
   */
  protected $tokenLimit;

  /**
   * Constructs a new TokenStorageService object.
   *
   * @param \Drupal\Core\Database\Connection $database
   *   The database connection.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   * @param \Symfony\Component\HttpFoundation\RequestStack $request_stack
   *   The request stack.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   */
  public function __construct(
    Connection $database,
    LoggerChannelFactoryInterface $logger_factory,
    RequestStack $request_stack,
    ConfigFactoryInterface $config_factory,
  ) {
    $this->database = $database;
    $this->logger = $logger_factory->get('api_auth');
    $this->requestStack = $request_stack;
    $this->configFactory = $config_factory;

    // Get token limit from config.
    $config = $this->configFactory->get('api_auth.settings');
    $this->tokenLimit = $config->get('jwt_token_limit_per_user') ?: 10;
  }

  /**
   * Get token record by JTI.
   *
   * @param string $jti
   *   The JWT ID.
   *
   * @return array|false
   *   The token record or FALSE if not found.
   */
  public function getToken($jti) {
    try {
      $query = $this->database->select('api_active_tokens', 't')
        ->fields('t')
        ->condition('jti', $jti)
        ->range(0, 1);

      return $query->execute()->fetchAssoc();
    }
    catch (\Exception $e) {
      $this->logger->error('Error retrieving token: @error', ['@error' => $e->getMessage()]);

      return FALSE;
    }
  }

  /**
   * Get active token count for a user.
   *
   * @param int $user_id
   *   The user ID.
   * @param string|null $type
   *   The token type or NULL for all types.
   *
   * @return int
   *   The number of active tokens.
   */
  public function getUserTokenCount($user_id, $type = NULL) {
    try {
      $query = $this->database->select('api_active_tokens', 't')
        ->condition('user_id', $user_id)
        ->condition('is_revoked', 0)
        ->condition('expiration', time(), '>');

      if ($type) {
        $query->condition('type', $type);
      }

      $query->addExpression('COUNT(id)', 'token_count');

      return (int) $query->execute()->fetchField();
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to get user token count: @error', ['@error' => $e->getMessage()]);

      return 0;
    }
  }

  /**
   * Check if a token exists and is valid.
   *
   * @param string $jti
   *   The JWT ID.
   *
   * @return bool
   *   TRUE if token exists and is valid, FALSE otherwise.
   */
  public function isTokenValid($jti) {
    try {
      $query = $this->database->select('api_active_tokens', 't')
        ->fields('t', ['is_revoked', 'expiration'])
        ->condition('jti', $jti)
        ->range(0, 1);

      $result = $query->execute()->fetchAssoc();

      if (!$result) {
        return FALSE;
      }

      // Check if token is revoked or expired.
      return $result['is_revoked'] == 0 && $result['expiration'] > time();
    }
    catch (\Exception $e) {
      $this->logger->error('Error checking token validity: @error', ['@error' => $e->getMessage()]);

      return FALSE;
    }
  }

  /**
   * Delete expired tokens from the database.
   *
   * @param int|null $timestamp
   *   The current timestamp or NULL to use the current time.
   *
   * @return int
   *   The number of tokens deleted.
   */
  public function purgeExpiredTokens($timestamp = NULL) {
    $timestamp = $timestamp ?: time();

    try {
      return $this->database->delete('api_active_tokens')
        ->condition('expiration', $timestamp, '<')
        ->execute();
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to purge expired tokens: @error', ['@error' => $e->getMessage()]);

      return 0;
    }
  }

  /**
   * Remove a token by its value and all related tokens.
   *
   * @param string $token
   *   The raw JWT token.
   *
   * @return int
   *   The number of tokens removed.
   */
  public function removeTokenByValue($token) {
    try {
      // Hash the token.
      $token_hash = hash('sha256', $token);

      // Find the token.
      $record = $this->database->select('api_active_tokens', 't')
        ->fields('t', ['jti'])
        ->condition('token_hash', $token_hash)
        ->range(0, 1)
        ->execute()
        ->fetchField();

      if (!$record) {
        return 0;
      }

      // Remove the entire token family.
      return $this->removeTokenFamily($record);
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to remove token by value: @error', ['@error' => $e->getMessage()]);

      return 0;
    }
  }

  /**
   * Completely remove a token and its family (access + refresh tokens).
   *
   * @param string $jti
   *   The JWT ID of any token in the family.
   *
   * @return int
   *   The number of tokens removed.
   */
  public function removeTokenFamily($jti) {
    try {
      // First find the token record.
      $token = $this->getToken($jti);

      if (!$token) {
        return 0;
      }

      $removed = 0;

      // If this is an access token, find and remove its refresh tokens.
      if ($token['type'] === 'access') {
        // First find refresh tokens linked to this access token.
        $refresh_tokens = $this->database->select('api_active_tokens', 't')
          ->fields('t', ['id'])
          ->condition('parent_id', $token['id'])
          ->execute()
          ->fetchCol();

        if (!empty($refresh_tokens)) {
          // Delete the refresh tokens.
          $this->database->delete('api_active_tokens')
            ->condition('id', $refresh_tokens, 'IN')
            ->execute();
          $removed += \count($refresh_tokens);
        }
      }
      // If this is a refresh token, find and remove its parent access token.
      elseif ($token['type'] === 'refresh' && !empty($token['parent_id'])) {
        // Delete any other refresh tokens linked to the same access token.
        $siblings_removed = $this->database->delete('api_active_tokens')
          ->condition('parent_id', $token['parent_id'])
          ->condition('id', $token['id'], '!=')
          ->execute();
        $removed += $siblings_removed;

        // Delete the access token.
        $access_removed = $this->database->delete('api_active_tokens')
          ->condition('id', $token['parent_id'])
          ->execute();
        $removed += $access_removed;
      }

      // Delete the token itself.
      $this->database->delete('api_active_tokens')
        ->condition('id', $token['id'])
        ->execute();
      ++$removed;

      $this->logger->notice(
        'Removed token family for JTI @jti (total @count tokens removed)',
        [
          '@jti' => $jti,
          '@count' => $removed,
        ]
      );

      return $removed;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to remove token family: @error', ['@error' => $e->getMessage()]);

      return 0;
    }
  }

  /**
   * Revoke related tokens (parent and children).
   *
   * @param int $token_id
   *   The token ID.
   *
   * @return int
   *   The number of tokens revoked.
   */
  public function revokeRelatedTokens($token_id) {
    $count = 0;

    try {
      // First get the token record.
      $token = $this->database->select('api_active_tokens', 't')
        ->fields('t')
        ->condition('id', $token_id)
        ->execute()
        ->fetchAssoc();

      if (!$token) {
        return 0;
      }

      // Revoke parent token if this is a refresh token.
      if ($token['type'] === 'refresh' && !empty($token['parent_id'])) {
        $this->database->update('api_active_tokens')
          ->fields(['is_revoked' => 1])
          ->condition('id', $token['parent_id'])
          ->execute();
        ++$count;
      }

      // Revoke child tokens if this is an access token.
      if ($token['type'] === 'access') {
        $children_updated = $this->database->update('api_active_tokens')
          ->fields(['is_revoked' => 1])
          ->condition('parent_id', $token_id)
          ->execute();
        $count += $children_updated;
      }

      return $count;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to revoke related tokens: @error', ['@error' => $e->getMessage()]);

      return 0;
    }
  }

  /**
   * Revoke a token by its JTI.
   *
   * @param string $jti
   *   The JWT ID.
   *
   * @return bool
   *   TRUE if token was revoked, FALSE otherwise.
   */
  public function revokeToken($jti) {
    try {
      $updated = $this->database->update('api_active_tokens')
        ->fields(['is_revoked' => 1])
        ->condition('jti', $jti)
        ->execute();

      return $updated > 0;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to revoke token: @error', ['@error' => $e->getMessage()]);

      return FALSE;
    }
  }

  /**
   * Revoke a token by its hash value.
   *
   * @param string $token
   *   The raw JWT token.
   *
   * @return bool
   *   TRUE if token was revoked, FALSE otherwise.
   */
  public function revokeTokenByValue($token) {
    try {
      // Hash the token.
      $token_hash = hash('sha256', $token);

      $updated = $this->database->update('api_active_tokens')
        ->fields(['is_revoked' => 1])
        ->condition('token_hash', $token_hash)
        ->execute();

      return $updated > 0;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to revoke token by hash: @error', ['@error' => $e->getMessage()]);

      return FALSE;
    }
  }

  /**
   * Revoke all tokens for a user.
   *
   * @param int $user_id
   *   The user ID.
   * @param string|null $type
   *   The token type to revoke or NULL for all types.
   *
   * @return int
   *   The number of tokens revoked.
   */
  public function revokeUserTokens($user_id, $type = NULL) {
    try {
      $query = $this->database->update('api_active_tokens')
        ->fields(['is_revoked' => 1])
        ->condition('user_id', $user_id)
      // Only update tokens that aren't already revoked.
        ->condition('is_revoked', 0);

      if ($type) {
        $query->condition('type', $type);
      }

      return $query->execute();
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to revoke user tokens: @error', ['@error' => $e->getMessage()]);

      return 0;
    }
  }

  /**
   * Store a token in the database.
   *
   * @param string $token
   *   The JWT token.
   * @param array $payload
   *   The token payload.
   * @param string $type
   *   The token type ('access' or 'refresh').
   * @param int|null $parent_id
   *   The ID of the parent token record.
   *
   * @return int|bool
   *   The ID of the stored token or FALSE on failure.
   */
  public function storeToken($token, array $payload, $type = 'access', $parent_id = NULL) {
    try {
      // Hash the token for storage.
      $token_hash = hash('sha256', $token);

      // Get client information.
      $request = $this->requestStack->getCurrentRequest();
      $ip = $request ? $request->getClientIp() : '';
      $user_agent = $request ? $request->headers->get('User-Agent') : '';

      // Prepare token record.
      $record = [
        'jti' => $payload['jti'],
        'user_id' => $payload['uid'],
        'token_hash' => $token_hash,
        'type' => $type,
        'issued' => $payload['iat'],
        'expiration' => $payload['exp'],
        'ip' => $ip,
        'user_agent' => $user_agent,
        'is_revoked' => 0,
      ];

      // Add parent_id if provided.
      if ($parent_id) {
        $record['parent_id'] = $parent_id;
      }

      // Insert the token record.
      $id = $this->database->insert('api_active_tokens')
        ->fields($record)
        ->execute();

      // Enforce token limit per user if necessary.
      $this->enforceTokenLimit($payload['uid'], $type);

      return $id;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to store token: @error', ['@error' => $e->getMessage()]);

      return FALSE;
    }
  }

  /**
   * Enforce token limit per user.
   *
   * @param int $user_id
   *   The user ID.
   * @param string $type
   *   The token type ('access' or 'refresh').
   */
  protected function enforceTokenLimit($user_id, $type) {
    // Skip if limit is 0 (unlimited) or for access tokens.
    if ($this->tokenLimit <= 0 || $type !== 'refresh') {
      return;
    }

    try {
      // Get count of active tokens for this user.
      $query = $this->database->select('api_active_tokens', 't')
        ->condition('user_id', $user_id)
        ->condition('type', $type)
        ->condition('is_revoked', 0)
        ->condition('expiration', time(), '>');
      $query->addExpression('COUNT(id)', 'token_count');
      $count = $query->execute()->fetchField();

      // If user has more tokens than limit, revoke oldest tokens.
      if ($count > $this->tokenLimit) {
        $excess = $count - $this->tokenLimit;

        // Get oldest token IDs.
        $query = $this->database->select('api_active_tokens', 't')
          ->fields('t', ['jti'])
          ->condition('user_id', $user_id)
          ->condition('type', $type)
          ->condition('is_revoked', 0)
          ->orderBy('issued', 'ASC')
          ->range(0, $excess);

        $jti_list = $query->execute()->fetchCol();

        // Revoke these tokens.
        if (!empty($jti_list)) {
          $this->database->update('api_active_tokens')
            ->fields(['is_revoked' => 1])
            ->condition('jti', $jti_list, 'IN')
            ->execute();

          $this->logger->notice(
            'Revoked @count oldest tokens for user @uid to enforce token limit.',
            ['@count' => \count($jti_list), '@uid' => $user_id]
          );
        }
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to enforce token limit: @error', ['@error' => $e->getMessage()]);
    }
  }

}
