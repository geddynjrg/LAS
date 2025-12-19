<?php

namespace Drupal\api_auth\Plugin\rest\resource;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\rest\Attribute\RestResource;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\api_auth\Service\ApiJwtService;
use Drupal\user\Entity\User;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

/**
 * Provides a resource for eCitizen SSO login.
 */
#[RestResource(
  id: 'api_ecitizen_login',
  label: new TranslatableMarkup('eCitizen SSO Login'),
  uri_paths: [
    'create' => '/api/v1/user/ecitizen-login',
  ],
)]
class ApiECitizenLoginResource extends ResourceBase {

  /**
   * The current request.
   */
  protected $currentRequest;

  /**
   * The current user.
   */
  protected $currentUser;

  /**
   * The entity type manager.
   */
  protected $entityTypeManager;

  /**
   * The JWT service.
   */
  protected $jwtService;

  /**
   * Constructs a new ApiECitizenLoginResource object.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    AccountInterface $current_user,
    EntityTypeManagerInterface $entity_type_manager,
    ApiJwtService $jwt_service,
    Request $current_request,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    $this->currentUser = $current_user;
    $this->entityTypeManager = $entity_type_manager;
    $this->jwtService = $jwt_service;
    $this->currentRequest = $current_request;
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
      $container->get('entity_type.manager'),
      $container->get('api_auth.jwt_service'),
      $container->get('request_stack')->getCurrentRequest()
    );
  }

  /**
   * Responds to POST requests for eCitizen SSO login.
   */
  public function post(?array $data = NULL) {

    // Validate required fields
    if (empty($data['email'])) {
      throw new BadRequestHttpException('Email is required.');
    }

    if (empty($data['ecitizen_data']['id'])) {
      throw new BadRequestHttpException('eCitizen ID is required.');
    }

    $email = $data['email'];
    $ecitizenData = $data['ecitizen_data'] ?? [];

    $user_storage = $this->entityTypeManager->getStorage('user');

    // Try to load by email (eCitizen uses email as primary identifier)
    $users = $user_storage->loadByProperties(['mail' => $email]);
    $user = reset($users);

    $isNewUser = false;

    // Create user if not exists
    if (!$user) {
      $isNewUser = true;

      // Generate username from email
      $baseUsername = preg_replace('/@.*$/', '', $email);
      $username = $baseUsername;
      $counter = 1;

      while ($user_storage->loadByProperties(['name' => $username])) {
        $username = $baseUsername . '_' . $counter;
        $counter++;
      }

      // Create user with random password (won't be used for eCitizen SSO)
      $user = $user_storage->create([
        'name' => $username,
        'mail' => $email,
        'status' => 1,
        'pass' => \Drupal::service('password_generator')->generate(),
        'init' => $email,
      ]);

      // Add eCitizen metadata if fields exist
      if ($user->hasField('field_ecitizen_id') && isset($ecitizenData['id'])) {
        $user->set('field_ecitizen_id', $ecitizenData['id']);
      }

      if ($user->hasField('field_ecitizen_data') && !empty($ecitizenData)) {
        $user->set('field_ecitizen_data', json_encode($ecitizenData));
      }

      if ($user->hasField('field_login_method')) {
        $user->set('field_login_method', 'ecitizen_sso');
      }

      // Validate before saving
      $violations = $user->validate();
      if ($violations->count() > 0) {
        $errors = [];
        foreach ($violations as $violation) {
          $errors[] = $violation->getPropertyPath() . ': ' . $violation->getMessage();
        }
        throw new BadRequestHttpException('User validation failed: ' . implode(', ', $errors));
      }

      $user->save();

    } else {
      // Update eCitizen data for returning users
      if (!empty($ecitizenData)) {
        if ($user->hasField('field_ecitizen_data')) {
          $user->set('field_ecitizen_data', json_encode($ecitizenData));
        }
        if (isset($ecitizenData['id']) && $user->hasField('field_ecitizen_id')) {
          $user->set('field_ecitizen_id', $ecitizenData['id']);
        }
      }
    }

    // Check if user is active
    if (!$user->isActive()) {
      throw new UnauthorizedHttpException('Bearer', 'User account is blocked.');
    }

    // Update last login time
    $user->setLastAccessTime(time());
    $user->save();

    // Generate JWT tokens
    $tokens = $this->jwtService->generateTokens($user);

    // Prepare response data
    $response_data = [
      'data' => [
        'access_token' => $tokens['access_token'],
        'refresh_token' => $tokens['refresh_token'],
        'expires_in' => $tokens['expires_in'],
        'token_type' => 'Bearer',
        'user' => [
          'email' => $user->getEmail(),
          'name' => $user->getDisplayName(),
          'uid' => $user->id(),
          'username' => $user->getAccountName(),
          'is_new' => $isNewUser,
        ]
      ],
      'meta' => [
        'timestamp' => time(),
        'ecitizen_authenticated' => true,
        'version' => 'v1',
      ],
    ];

    return new ModifiedResourceResponse($response_data, 200);
  }

  /**
   * Complete eCitizen OAuth flow in one call.
   * POST /api/v1/user/ecitizen-oauth
  */
  public function oauthExchange(array $data) {

    // Validate required fields
    if (empty($data['code'])) {
      throw new BadRequestHttpException('Authorization code is required.');
    }

    if (empty($data['code_verifier'])) {
      throw new BadRequestHttpException('PKCE code verifier is required.');
    }

    // Get configuration from settings
    $config = \Drupal::config('api_auth.settings');
    $clientId = $config->get('ecitizen_client_id') ?: 'b30d441b886d8a1cd539e007bc5a3f40';
    $clientSecret = $config->get('ecitizen_client_secret') ?: 'fptijPtHhSveQCPlqtoSKicuRRuDHBUw';
    $redirectUri = $data['redirect_uri'] ?? 'http://uwezo.ddev.site/auth/callback';

    // 1. Exchange code for eCitizen token
    $tokenUrl = 'https://accounts.ecitizen.go.ke/oauth/access-token';

    try {
      $response = \Drupal::httpClient()->post($tokenUrl, [
        'form_params' => [
          'grant_type' => 'authorization_code',
          'code' => $data['code'],
          'redirect_uri' => $redirectUri,
          'client_id' => $clientId,
          'client_secret' => $clientSecret,
          'code_verifier' => $data['code_verifier'],
        ],
        'headers' => ['Accept' => 'application/json'],
        'verify' => false, // For development
      ]);

      $tokenData = json_decode($response->getBody(), TRUE);

      if (empty($tokenData['access_token'])) {
        throw new BadRequestHttpException('Failed to get access token from eCitizen.');
      }


    } catch (\Exception $e) {
      throw new BadRequestHttpException('eCitizen authentication failed.');
    }

    // 2. Get user info from eCitizen
    $userInfoUrl = 'https://accounts.ecitizen.go.ke/api/user-info';

    try {
      $userResponse = \Drupal::httpClient()->get($userInfoUrl, [
        'headers' => [
          'Authorization' => 'Bearer ' . $tokenData['access_token'],
          'Accept' => 'application/json',
        ],
        'verify' => false,
      ]);

      $userInfo = json_decode($userResponse->getBody(), TRUE);

    } catch (\Exception $e) {
      throw new BadRequestHttpException('Failed to get user information from eCitizen.');
    }

    // 3. Use your EXISTING user creation/login logic
    // Call your existing post() method with the user data
    $loginData = [
      'email' => $userInfo['email'] ?? '',
      'ecitizen_data' => $userInfo,
    ];

    // Call the existing post method
    return $this->post($loginData);
  }

}
