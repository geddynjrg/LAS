<?php

namespace Drupal\api_auth\Controller;

use Drupal\Component\Datetime\TimeInterface;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Url;
use Drupal\api_auth\Service\TokenStorageService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Controller for JWT token management.
 */
class TokenManagementController extends ControllerBase {

  /**
   * The database connection.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * The date formatter service.
   *
   * @var \Drupal\Core\Datetime\DateFormatterInterface
   */
  protected $dateFormatter;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The time service.
   *
   * @var \Drupal\Component\Datetime\TimeInterface
   */
  protected $time;

  /**
   * The token storage service.
   *
   * @var \Drupal\api_auth\Service\TokenStorageService
   */
  protected $tokenStorage;

  /**
   * Constructs a new TokenManagementController object.
   *
   * @param \Drupal\api_auth\Service\TokenStorageService $token_storage
   *   The token storage service.
   * @param \Drupal\Core\Datetime\DateFormatterInterface $date_formatter
   *   The date formatter service.
   * @param \Drupal\Core\Database\Connection $database
   *   The database connection.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Component\Datetime\TimeInterface $time
   *   The time service.
   */
  public function __construct(
    TokenStorageService $token_storage,
    DateFormatterInterface $date_formatter,
    Connection $database,
    EntityTypeManagerInterface $entity_type_manager,
    TimeInterface $time,
  ) {
    $this->tokenStorage = $token_storage;
    $this->dateFormatter = $date_formatter;
    $this->database = $database;
    $this->entityTypeManager = $entity_type_manager;
    $this->time = $time;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('api_auth.token_storage'),
      $container->get('date.formatter'),
      $container->get('database'),
      $container->get('entity_type.manager'),
      $container->get('datetime.time')
    );
  }

  /**
   * Displays an overview of active tokens.
   *
   * @return array
   *   A render array for the token management page.
   */
  public function overview() {
    // Purge expired tokens first.
    $purged = $this->tokenStorage->purgeExpiredTokens();

    if ($purged > 0) {
      $this->messenger()->addStatus($this->t('Removed @count expired tokens.', ['@count' => $purged]));
    }

    // Build the table header.
    $header = [
      'id' => $this->t('ID'),
      'type' => $this->t('Type'),
      'user' => $this->t('User'),
      'issued' => $this->t('Issued'),
      'expires' => $this->t('Expires'),
      'is_revoked' => $this->t('Status'),
      'ip' => $this->t('IP Address'),
      'operations' => $this->t('Operations'),
    ];

    // Get tokens from database.
    $tokens = $this->getActiveTokens();
    $rows = [];

    foreach ($tokens as $token) {
      // Load user entity to display username.
      $user_account = $this->entityTypeManager->getStorage('user')->load($token['user_id']);
      $username = $user_account ? $user_account->getAccountName() : $this->t('Unknown (UID: @uid)', ['@uid' => $token['user_id']]);

      // Format dates.
      $issued = $this->dateFormatter->format($token['issued'], 'medium');
      $expires = $this->dateFormatter->format($token['expiration'], 'medium');
      $expires_from_now = $this->dateFormatter->formatTimeDiffUntil($token['expiration']);

      // Determine status.
      $now = $this->time->getRequestTime();

      if ($token['is_revoked']) {
        $status = $this->t('Revoked');
        $status_class = 'color-error';
      }
      elseif ($token['expiration'] < $now) {
        $status = $this->t('Expired');
        $status_class = 'color-warning';
      }
      else {
        $status = $this->t('Active');
        $status_class = 'color-success';
      }

      // Build row.
      $row = [
        'id' => $token['id'],
        'type' => $token['type'],
        'user' => [
          'data' => [
            '#type' => 'link',
            '#title' => $username,
            '#url' => Url::fromRoute('entity.user.canonical', ['user' => $token['user_id']]),
          ],
        ],
        'issued' => $issued,
        'expires' => $expires . ' (' . $expires_from_now . ')',
        'is_revoked' => [
          'data' => [
            '#markup' => '<span class="' . $status_class . '">' . $status . '</span>',
          ],
        ],
        'ip' => $token['ip'] ?: $this->t('N/A'),
      ];

      // Add operations.
      $operations = [];

      if (!$token['is_revoked'] && $token['expiration'] >= $now) {
        $operations['revoke'] = [
          'title' => $this->t('Revoke'),
          'url' => Url::fromRoute('api_auth.token_revoke', ['token_id' => $token['id']]),
        ];
      }

      $row['operations'] = [
        'data' => [
          '#type' => 'operations',
          '#links' => $operations,
        ],
      ];

      $rows[] = $row;
    }

    // Build the table.
    $build['tokens_table'] = [
      '#type' => 'table',
      '#header' => $header,
      '#rows' => $rows,
      '#empty' => $this->t('No active tokens found.'),
    ];

    // Add a link to revoke all tokens.
    $build['revoke_all'] = [
      '#type' => 'link',
      '#title' => $this->t('Revoke all active tokens'),
      '#url' => Url::fromRoute('api_auth.token_revoke_all'),
      '#attributes' => [
        'class' => ['button', 'button--danger'],
      ],
      '#prefix' => '<div class="token-operations">',
      '#suffix' => '</div>',
    ];

    return $build;
  }

  /**
   * Get active tokens from the database.
   *
   * @param int $limit
   *   The maximum number of tokens to return (default: 100).
   *
   * @return array
   *   An array of token records.
   */
  protected function getActiveTokens($limit = 100) {
    $query = $this->database->select('api_active_tokens', 't')
      ->fields('t')
      ->orderBy('issued', 'DESC')
      ->range(0, $limit);

    return $query->execute()->fetchAll(\PDO::FETCH_ASSOC);
  }

}
