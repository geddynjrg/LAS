<?php

namespace Drupal\api_auth\Commands;

use Drupal\Core\Database\Connection;
use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\api_auth\Service\TokenStorageService;
use Drush\Commands\DrushCommands;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Drush commands for the API Auth module.
 */
class ApiAuthCommands extends DrushCommands implements ContainerInjectionInterface {

  /**
   * The database connection.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The token storage service.
   *
   * @var \Drupal\api_auth\Service\TokenStorageService
   */
  protected $tokenStorage;

  /**
   * Constructs a new ApiAuthCommands object.
   *
   * @param \Drupal\api_auth\Service\TokenStorageService $token_storage
   *   The token storage service.
   * @param \Drupal\Core\Database\Connection $database
   *   The database connection.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct(
    TokenStorageService $token_storage,
    Connection $database,
    EntityTypeManagerInterface $entity_type_manager,
  ) {
    parent::__construct();
    $this->tokenStorage = $token_storage;
    $this->database = $database;
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('api_auth.token_storage'),
      $container->get('database'),
      $container->get('entity_type.manager')
    );
  }

  /**
   * Purges expired tokens from the database.
   *
   * @command api:purge-tokens
   *
   * @aliases api-purge-tokens,tvet-rest:purge-tokens
   *
   * @usage api:purge-tokens
   *   Purges all expired tokens from the database.
   */
  public function purgeTokens() {
    $count = $this->tokenStorage->purgeExpiredTokens();

    if ($count > 0) {
      $this->logger()->success(dt('Purged @count expired tokens from the database.', ['@count' => $count]));
    }
    else {
      $this->logger()->notice(dt('No expired tokens found to purge.'));
    }

    return $count;
  }

  /**
   * Removes all tokens from the database.
   *
   * @command api:remove-all-tokens
   *
   * @aliases api-remove-all-tokens,tvet-rest:remove-all-tokens
   *
   * @usage api:remove-all-tokens
   *   Removes all tokens from the database.
   */
  public function removeAllTokens() {
    // Ask for confirmation.
    if (!$this->io()->confirm(dt('Are you sure you want to remove ALL tokens from the database? This cannot be undone.'))) {
      $this->logger()->notice(dt('Operation cancelled.'));

      return 0;
    }

    $this->database->truncate('api_active_tokens')->execute();

    $this->logger()->success(dt('All tokens have been removed from the database.'));

    return 0;
  }

  /**
   * Removes all tokens for a specific user.
   *
   * @param int $uid
   *   The user ID.
   *
   * @command api:remove-user-tokens
   *
   * @aliases api-remove-user-tokens,tvet-rest:remove-user-tokens
   *
   * @usage api:remove-user-tokens 123
   *   Removes all tokens for user with ID 123.
   */
  public function removeUserTokens($uid) {
    // Validate that the user exists.
    $user_storage = $this->entityTypeManager->getStorage('user');
    $user = $user_storage->load($uid);

    if (!$user) {
      $this->logger()->error(dt('User with ID @uid not found.', ['@uid' => $uid]));

      return 1;
    }

    // Remove all tokens for the user.
    $count = $this->tokenStorage->revokeUserTokens($uid);

    if ($count > 0) {
      $this->logger()->success(dt('Removed @count tokens for user @uid.', [
        '@count' => $count,
        '@uid' => $uid,
      ]));
    }
    else {
      $this->logger()->notice(dt('No tokens found for user @uid.', ['@uid' => $uid]));
    }

    return 0;
  }

  /**
   * Gets information about tokens in the database.
   *
   * @command api:token-stats
   *
   * @aliases api-token-stats,tvet-rest:token-stats
   *
   * @usage api:token-stats
   *   Gets statistics about stored tokens.
   */
  public function tokenStats() {
    $stats = [
      'total' => $this->getTokenCount(),
      'active' => $this->getActiveTokenCount(),
      'revoked' => $this->getRevokedTokenCount(),
      'expired' => $this->getExpiredTokenCount(),
      'access_tokens' => $this->getTokenCountByType('access'),
      'refresh_tokens' => $this->getTokenCountByType('refresh'),
      'users_with_tokens' => $this->getUsersWithTokensCount(),
    ];

    $this->output()->writeln(dt('Token Storage Statistics:'));
    $this->output()->writeln(dt('- Total tokens in database: @count', ['@count' => $stats['total']]));
    $this->output()->writeln(dt('- Active tokens: @count', ['@count' => $stats['active']]));
    $this->output()->writeln(dt('- Revoked tokens: @count', ['@count' => $stats['revoked']]));
    $this->output()->writeln(dt('- Expired tokens: @count', ['@count' => $stats['expired']]));
    $this->output()->writeln(dt('- Access tokens: @count', ['@count' => $stats['access_tokens']]));
    $this->output()->writeln(dt('- Refresh tokens: @count', ['@count' => $stats['refresh_tokens']]));
    $this->output()->writeln(dt('- Users with tokens: @count', ['@count' => $stats['users_with_tokens']]));

    return $stats;
  }

  /**
   * Gets the count of active tokens in the database.
   *
   * @return int
   *   The count of active tokens.
   */
  protected function getActiveTokenCount() {
    return (int) $this->database->select('api_active_tokens', 't')
      ->condition('is_revoked', 0)
      ->condition('expiration', time(), '>')
      ->countQuery()
      ->execute()
      ->fetchField();
  }

  /**
   * Gets the count of expired tokens in the database.
   *
   * @return int
   *   The count of expired tokens.
   */
  protected function getExpiredTokenCount() {
    return (int) $this->database->select('api_active_tokens', 't')
      ->condition('expiration', time(), '<')
      ->countQuery()
      ->execute()
      ->fetchField();
  }

  /**
   * Gets the count of revoked tokens in the database.
   *
   * @return int
   *   The count of revoked tokens.
   */
  protected function getRevokedTokenCount() {
    return (int) $this->database->select('api_active_tokens', 't')
      ->condition('is_revoked', 1)
      ->countQuery()
      ->execute()
      ->fetchField();
  }

  /**
   * Gets the total count of tokens in the database.
   *
   * @return int
   *   The count of tokens.
   */
  protected function getTokenCount() {
    return (int) $this->database->select('api_active_tokens', 't')
      ->countQuery()
      ->execute()
      ->fetchField();
  }

  /**
   * Gets the count of tokens by type.
   *
   * @param string $type
   *   The token type ('access' or 'refresh').
   *
   * @return int
   *   The count of tokens.
   */
  protected function getTokenCountByType($type) {
    return (int) $this->database->select('api_active_tokens', 't')
      ->condition('type', $type)
      ->countQuery()
      ->execute()
      ->fetchField();
  }

  /**
   * Gets the count of users with tokens.
   *
   * @return int
   *   The count of users.
   */
  protected function getUsersWithTokensCount() {
    $query = $this->database->select('api_active_tokens', 't');
    $query->addExpression('COUNT(DISTINCT user_id)', 'count');

    return (int) $query->execute()->fetchField();
  }

}
