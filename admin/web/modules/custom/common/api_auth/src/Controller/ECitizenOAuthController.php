<?php

namespace Drupal\api_auth\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\Core\Site\Settings;
use Drupal\Core\State\StateInterface;
use Drupal\user\UserDataInterface;
use GuzzleHttp\ClientInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Handles eCitizen OAuth flow.
 */
class ECitizenOAuthController extends ControllerBase {

  /**
   * The OAuth configuration.
   *
   * @var array
   */
  protected $oauthConfig;

  /**
   * The HTTP client.
   *
   * @var \GuzzleHttp\ClientInterface
   */
  protected $httpClient;

  /**
   * The logger factory.
   *
   * @var \Drupal\Core\Logger\LoggerChannelFactoryInterface
   */
  protected $loggerFactory;

  /**
   * The state service.
   *
   * @var \Drupal\Core\State\StateInterface
   */
  protected $state;

  /**
   * The user data service.
   *
   * @var \Drupal\user\UserDataInterface
   */
  protected $userData;

  /**
   * The JWT service.
   *
   * @var \Drupal\api_auth\JwtService
   */
  protected $jwtService;

  /**
   * Constructs a new ECitizenOAuthController object.
   */
  public function __construct(
    ClientInterface $http_client,
    LoggerChannelFactoryInterface $logger_factory,
    StateInterface $state,
    UserDataInterface $user_data,
    EntityTypeManagerInterface $entity_type_manager,
    $jwt_service,
  ) {
    $this->httpClient = $http_client;
    $this->loggerFactory = $logger_factory;
    $this->state = $state;
    $this->userData = $user_data;
    $this->entityTypeManager = $entity_type_manager;
    $this->jwtService = $jwt_service;
    $this->oauthConfig = Settings::get('ecitizen_oauth', []);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('http_client'),
      $container->get('logger.factory'),
      $container->get('state'),
      $container->get('user.data'),
      $container->get('entity_type.manager'),
      $container->get('api_auth.jwt_service')
    );
  }

  /**
   * Starts the eCitizen OAuth flow.
   */
  public function startEcitizenOauth(Request $request) {
    $allowedUrls = [
      'https://loans-staging.uwezo.go.ke',
      'https://loans.uwezo.go.ke',
    ];

    $origin = $request->query->get('origin');
    $callbackUrl = $request->query->get('callbackUrl') ?: '/dashboard';

    if (!$origin || !in_array($origin, $allowedUrls)) {
      $this->loggerFactory->get('ecitizen_auth')->warning('Untrusted origin: @origin', ['@origin' => $origin ?? 'none']);
      throw new AccessDeniedHttpException('Untrusted origin. Authentication blocked.');
    }

    $codeVerifier = $this->generateRandomString(64);
    $codeChallenge = $this->generateCodeChallenge($codeVerifier);
    $state = $this->generateRandomString(32);

    $this->state->set('ecitizen_pkce_' . $state, [
      'code_verifier' => $codeVerifier,
      'callback_url' => $callbackUrl,
      'timestamp' => time(),
    ]);

    $clientId = $this->oauthConfig['client_id'];
    $redirectUri = $this->oauthConfig['redirect_uri'];

    $params = [
      'response_type' => 'code',
      'client_id' => $clientId,
      'redirect_uri' => $redirectUri,
      'scope' => 'openid profile email',
      'code_challenge' => $codeChallenge,
      'code_challenge_method' => 'S256',
      'state' => $state,
    ];

    $authUrl = 'https://accounts.ecitizen.go.ke/oauth/authorize?' . http_build_query($params);
    return new TrustedRedirectResponse($authUrl);
  }

  /**
   * Callback for eCitizen OAuth.
   */
  public function callback(Request $request) {
    $code = $request->query->get('code');
    $state = $request->query->get('state');
    $error = $request->query->get('error');

    if ($error) {
      $errorDescription = $request->query->get('error_description');
      return $this->redirectWithError($state, [
        'error' => $error,
        'error_description' => $errorDescription ?? 'Unknown error',
      ]);
    }

    if (!$code || !$state) {
      return $this->redirectWithError($state, [
        'error' => 'invalid_request',
        'error_description' => 'Missing code or state parameter.',
      ]);
    }

    $pkceData = $this->state->get('ecitizen_pkce_' . $state);
    if (!$pkceData || (time() - $pkceData['timestamp'] > 3600)) {
      return $this->redirectWithError($state, [
        'error' => 'session_expired',
        'error_description' => 'Your login session expired. Please try again.',
      ]);
    }

    $tokenData = $this->exchangeCodeForToken($code, $pkceData['code_verifier']);
    $this->state->delete('ecitizen_pkce_' . $state);

    if (!$tokenData || empty($tokenData['access_token'])) {
      return $this->redirectWithError($state, ['error' => 'token_exchange_failed']);
    }

    $userInfo = $this->getUserInfo($tokenData['access_token']);
    if (!$userInfo || empty($userInfo['email'])) {
      return $this->redirectWithError($state, ['error' => 'invalid_user_info']);
    }

    $user = $this->handleUserData($userInfo['email'], $userInfo);
    $tokens = $this->jwtService->generateTokens($user);

    $redirectUrl = $this->buildFrontendRedirect('/ecitizen/callback', [
      'access_token' => $tokens['access_token'],
      'refresh_token' => $tokens['refresh_token'],
      'callback_url' => $pkceData['callback_url'] ?? '/dashboard',
    ]);

    return new TrustedRedirectResponse($redirectUrl);
  }

  /**
   * Exchanges authorization code for access token.
   */
  private function exchangeCodeForToken($code, $codeVerifier) {
    $data = [
      'grant_type' => 'authorization_code',
      'code' => $code,
      'redirect_uri' => $this->oauthConfig['redirect_uri'],
      'client_id' => $this->oauthConfig['client_id'],
      'client_secret' => $this->oauthConfig['client_secret'],
      'code_verifier' => $codeVerifier,
    ];

    try {
      $response = $this->httpClient->post($this->oauthConfig['ecitizen_token_url'], [
        'form_params' => $data,
        'headers' => ['Accept' => 'application/json'],
      ]);
      return json_decode($response->getBody(), TRUE);
    }
    catch (\Exception $e) {
      $this->loggerFactory->get('ecitizen_auth')->error('Token exchange failed: @message', ['@message' => $e->getMessage()]);
      return NULL;
    }
  }

  /**
   * Fetches user info from eCitizen.
   */
  private function getUserInfo($accessToken) {
    try {
      $response = $this->httpClient->get($this->oauthConfig['ecitizen_user_info_url'], [
        'headers' => [
          'Authorization' => 'Bearer ' . $accessToken,
          'Accept' => 'application/json',
        ],
      ]);
      $data = json_decode($response->getBody(), TRUE);
      return $data['data'] ?? $data;
    }
    catch (\Exception $e) {
      $this->loggerFactory->get('ecitizen_auth')->error('User Info Fetch Error: @msg', ['@msg' => $e->getMessage()]);
      return NULL;
    }
  }

  /**
   * Handles user creation or update.
   */
  private function handleUserData($email, $data) {
    $userStorage = $this->entityTypeManager->getStorage('user');
    $users = $userStorage->loadByProperties(['mail' => $email]);
    $user = reset($users);

    if (!$user) {
      $user = $userStorage->create([
        'name' => $email,
        'mail' => $email,
        'status' => 1,
      ]);
    }

    if (isset($data['mobile_number']) && $user->hasField('field_phone_number')) {
      $user->set('field_phone_number', $data['mobile_number']);
    }

    $user->save();

    $this->userData->set('api_auth', $user->id(), 'ecitizen_profile', [
      'id_number' => $data['id_number'] ?? '',
      'kra_pin' => $data['kra_pin_number'] ?? '',
    ]);

    return $user;
  }

  /**
   * Builds the frontend redirect URL.
   */
  private function buildFrontendRedirect($path, $params) {
    $frontendBase = $this->oauthConfig['frontend_url'] ?? 'https://loans.uwezo.go.ke';
    return $frontendBase . $path . '?' . http_build_query($params);
  }

  /**
   * Redirects to frontend with error parameters.
   */
  private function redirectWithError($state, $errorParams) {
    $url = $this->buildFrontendRedirect('/ecitizen/callback', $errorParams);
    return new TrustedRedirectResponse($url);
  }

  /**
   * Generates a random URL-safe string.
   */
  private function generateRandomString($length) {
    return rtrim(strtr(base64_encode(random_bytes($length)), '+/', '-_'), '=');
  }

  /**
   * Generates a PKCE code challenge.
   */
  private function generateCodeChallenge($verifier) {
    $hash = hash('sha256', $verifier, TRUE);
    return rtrim(strtr(base64_encode($hash), '+/', '-_'), '=');
  }

}
