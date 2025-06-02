<?php

namespace Drupal\api_auth\Plugin\rest\resource;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\rest\Attribute\RestResource;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

/**
 * Provides a resource for accessing protected user profile data.
 */
#[RestResource(
  id: 'api_user_profile',
  label: new TranslatableMarkup('API User Profile'),
  uri_paths: [
    'canonical' => '/api/v1/user/profile',
  ],
)]
class ApiUserProfileResource extends ResourceBase {

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
   * Constructs a new ApiUserProfileResource object.
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
   * @param \Drupal\Core\Session\AccountProxyInterface $current_user
   *   The current user.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    AccountProxyInterface $current_user,
    EntityTypeManagerInterface $entity_type_manager,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    $this->currentUser = $current_user;
    $this->entityTypeManager = $entity_type_manager;
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
      $container->get('current_user'),
      $container->get('entity_type.manager')
    );
  }

  /**
   * Responds to GET requests.
   *
   * Returns profile information for the authenticated user.
   *
   * @throws \Symfony\Component\HttpKernel\Exception\HttpException
   *
   * @return \Drupal\rest\ModifiedResourceResponse
   *   The HTTP response object.
   */
  public function get() {
    // Check if the user is authenticated.
    if (!$this->currentUser->isAuthenticated()) {
      $this->logger->warning('Unauthenticated user attempted to access user profile endpoint');

      throw new UnauthorizedHttpException('Bearer', 'Authentication required to access this resource.');
    }

    try {
      // Get user data.
      $user_storage = $this->entityTypeManager->getStorage('user');
      $user = $user_storage->load($this->currentUser->id());

      if (!$user) {
        $this->logger->error('User entity not found for authenticated user @uid', [
          '@uid' => $this->currentUser->id(),
        ]);

        throw new NotFoundHttpException('User not found.');
      }

      // Prepare response data (excluding sensitive information)
      $response_data = [
        'data' => [
          'uid' => $user->id(),
          'email' => $user->getEmail(),
          'name' => $user->getDisplayName(),
          'roles' => $user->getRoles(),
          'created' => date('c', $user->getCreatedTime()),
          'last_access' => date('c', $user->getLastAccessedTime()),
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];

      $this->logger->info('User profile retrieved for user @uid', [
        '@uid' => $user->id(),
      ]);

      return new ModifiedResourceResponse($response_data, 200);
    }
    catch (\Exception $e) {
      $this->logger->error('Error retrieving user profile: @message', [
        '@message' => $e->getMessage(),
      ]);

      throw $e;
    }
  }

}
