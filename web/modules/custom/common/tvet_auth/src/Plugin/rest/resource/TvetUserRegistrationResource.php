<?php

namespace Drupal\tvet_auth\Plugin\rest\resource;

use Drupal\Core\Config\ImmutableConfig;
use Drupal\Core\Password\PasswordGeneratorInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\rest\Attribute\RestResource;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\tvet_auth\Service\TvetJwtService;
use Drupal\user\Entity\User;
use Drupal\user\Plugin\rest\resource\UserRegistrationResource;
use Drupal\user\UserInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Provides a resource for TVET user registration.
 *
 * This extends the core UserRegistrationResource but provides a custom
 * endpoint at api/v1/user/register.
 */
#[RestResource(
  id: 'tvet_user_registration',
  label: new TranslatableMarkup('TVET User Registration'),
  serialization_class: User::class,
  uri_paths: [
    'create' => '/api/v1/user/register',
  ],
)]
class TvetUserRegistrationResource extends UserRegistrationResource {

  /**
   * The JWT service.
   *
   * @var \Drupal\tvet_auth\Service\TvetJwtService
   */
  protected $jwtService;

  /**
   * Constructs a new TvetUserRegistrationResource instance.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin ID for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param array $serializer_formats
   *   The available serialization formats.
   * @param \Psr\Log\LoggerInterface $logger
   *   A logger instance.
   * @param \Drupal\Core\Config\ImmutableConfig $userSettings
   *   A user settings config instance.
   * @param \Drupal\Core\Session\AccountInterface $currentUser
   *   The current user.
   * @param \Drupal\Core\Password\PasswordGeneratorInterface $passwordGenerator
   *   The password generator.
   * @param \Drupal\tvet_auth\Service\TvetJwtService $jwt_service
   *   The JWT service.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    protected ImmutableConfig $userSettings,
    protected AccountInterface $currentUser,
    protected PasswordGeneratorInterface $passwordGenerator,
    TvetJwtService $jwt_service,
  ) {
    parent::__construct(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $serializer_formats,
      $logger,
      $userSettings,
      $currentUser,
      $passwordGenerator
    );
    $this->jwtService = $jwt_service;
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
      $container->get('logger.factory')->get('tvet_auth'),
      $container->get('config.factory')->get('user.settings'),
      $container->get('current_user'),
      $container->get('password_generator'),
      $container->get('tvet_auth.jwt_service')
    );
  }

  /**
   * Responds to user registration POST request.
   *
   * Extends the parent method to add TVET-specific functionality.
   *
   * @param \Drupal\user\UserInterface $account
   *   The user account entity.
   *
   * @return \Drupal\rest\ModifiedResourceResponse
   *   The HTTP response object.
   */
  public function post(?UserInterface $account = NULL) {
    if ($account === NULL) {
      throw new BadRequestHttpException('No user account data for registration received.');
    }

    try {
      // Call the parent method to handle the core registration logic.
      // The parent method returns a ModifiedResourceResponse.
      parent::post($account);

      // After registration, reload the user to get the most current data
      // The parent method should have saved the account.
      $user_id = $account->id();

      if ($user_id) {
        $account = User::load($user_id);
      }

      // Generate JWT tokens for the newly registered user.
      $tokens = $this->jwtService->generateTokens($account);

      // Format the response data according to TVET REST API standards.
      $data = [
        'data' => [
          'mail' => $account->getEmail(),
          'access_token' => $tokens['access_token'],
          'refresh_token' => $tokens['refresh_token'],
          'expires_in' => $tokens['expires_in'],
          'token_type' => 'Bearer',
          'status' => $account->isActive() ? 'active' : 'pending',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];

      return new ModifiedResourceResponse($data, 200);
    }
    catch (\Exception $e) {
      $this->logger->error('Error during user registration: @message', ['@message' => $e->getMessage()]);

      throw $e;
    }
  }

}
