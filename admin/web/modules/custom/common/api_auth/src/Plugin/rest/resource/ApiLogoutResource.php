<?php

namespace Drupal\api_auth\Plugin\rest\resource;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\rest\Attribute\RestResource;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\api_auth\Service\TokenStorageService;
use Drupal\api_auth\Service\ApiJwtService;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

/**
 * Provides a resource for user logout.
 */
#[RestResource(
  id: 'api_logout',
  label: new TranslatableMarkup('API Logout'),
  uri_paths: [
    'create' => '/api/v1/user/logout',
  ],
)]
class ApiLogoutResource extends ResourceBase {

  /**
   * The current user.
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
   * The JWT service.
   *
   * @var \Drupal\api_auth\Service\ApiJwtService
   */
  protected $jwtService;

  /**
   * The request stack.
   *
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  protected $requestStack;

  /**
   * The token storage service.
   *
   * @var \Drupal\api_auth\Service\TokenStorageService
   */
  protected $tokenStorage;

  /**
   * Constructs a new ApiLogoutResource object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param array $serializer_formats
   *   The available serialization formats.
   * @param \Psr\Log\LoggerInterface $logger
   *   A logger instance.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\api_auth\Service\ApiJwtService $jwt_service
   *   The JWT service.
   * @param \Drupal\Core\Session\AccountProxyInterface $current_user
   *   The current user.
   * @param \Symfony\Component\HttpFoundation\RequestStack $request_stack
   *   The request stack.
   * @param \Drupal\api_auth\Service\TokenStorageService $token_storage
   *   The token storage service.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    EntityTypeManagerInterface $entity_type_manager,
    ApiJwtService $jwt_service,
    AccountProxyInterface $current_user,
    RequestStack $request_stack,
    TokenStorageService $token_storage,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    $this->entityTypeManager = $entity_type_manager;
    $this->jwtService = $jwt_service;
    $this->currentUser = $current_user;
    $this->requestStack = $request_stack;
    $this->tokenStorage = $token_storage;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->getParameter('serializer.formats'),
      $container->get('logger.factory')->get('api_auth'),
      $container->get('entity_type.manager'),
      $container->get('api_auth.jwt_service'),
      $container->get('current_user'),
      $container->get('request_stack'),
      $container->get('api_auth.token_storage')
    );
  }

  /**
   * Responds to POST requests for logout.
   *
   * @param array $data
   *   The request data (optional).
   *
   * @throws \Symfony\Component\HttpKernel\Exception\HttpException
   *
   * @return \Drupal\rest\ModifiedResourceResponse
   *   The HTTP response object.
   */
  public function post(?array $data = NULL) {
    // Extract token from Authorization header.
    $token = $this->extractToken();

    if (empty($token)) {
      throw new UnauthorizedHttpException('Bearer', 'No authentication token provided.');
    }

    // Validate token and get user.
    $user = $this->jwtService->getUserFromToken($token);

    if (!$user) {
      throw new UnauthorizedHttpException('Bearer', 'Invalid or expired token.');
    }

    $removed_count = 0;

    // Remove ALL tokens for user (complete logout)
    $removed_count = $this->jwtService->removeAllUserTokens($user);
    $this->logger->notice('Removed all @count tokens for user @uid during logout', [
      '@count' => $removed_count,
      '@uid' => $user->id(),
    ]);

    // Log the logout event.
    $this->logger->notice('User @uid logged out via API', ['@uid' => $user->id()]);

    // Return success response.
    $response_data = [
      'data' => [
        'message' => 'Successfully logged out',
        'removed_tokens' => $removed_count,
      ],
      'meta' => [
        'timestamp' => time(),
        'version' => 'v1',
      ],
    ];

    return new ModifiedResourceResponse($response_data, 200);
  }

  /**
   * Extracts the token from the Authorization header.
   *
   * @return string|null
   *   The JWT token or NULL if not found.
   */
  protected function extractToken() {
    $request = $this->requestStack->getCurrentRequest();
    $auth_header = $request->headers->get('Authorization');

    if (empty($auth_header)) {
      return NULL;
    }

    if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
      return $matches[1];
    }

    return NULL;
  }

}
