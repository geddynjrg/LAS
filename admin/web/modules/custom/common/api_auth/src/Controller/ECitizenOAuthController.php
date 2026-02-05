<?php
// modules/custom/api_auth/src/Controller/ECitizenOAuthController.php

namespace Drupal\api_auth\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Routing\TrustedRedirectResponse;
use Drupal\Core\Site\Settings;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

/**
 * Handles eCitizen OAuth flow
 */
class ECitizenOAuthController extends ControllerBase {

  protected $oauthConfig;

  public function __construct() {
    $this->oauthConfig = Settings::get('ecitizen_oauth', []);
  }

  private function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
  }

  private function generateRandomString($length) {
    return $this->base64UrlEncode(random_bytes($length));
  }

  private function generateCodeChallenge($verifier) {
    $hash = hash('sha256', $verifier, TRUE);
    return $this->base64UrlEncode($hash);
  }


  public function startEcitizenOauth(Request $request) {

    $allowedUrls = [
      'http://localhost:3000',
      'https://loans-staging.uwezo.go.ke',
      'https://loans.uwezo.go.ke',
    ];

    $origin = $request->query->get('origin');
    $callbackUrl = $request->query->get('callbackUrl') ?: '/dashboard';

    if (!$origin || !in_array($origin, $allowedUrls)) {
      \Drupal::logger('ecitizen_auth')->warning('Untrusted origin: @origin', ['@origin' => $origin ?? 'none']);
      throw new AccessDeniedHttpException('Untrusted origin. Authentication blocked.');
    }

    $codeVerifier = $this->generateRandomString(64);
    $codeChallenge = $this->generateCodeChallenge($codeVerifier);
    $state = $this->generateRandomString(32);


    $session = $request->getSession();

    $tempstore = \Drupal::service('tempstore.private')->get('api_auth_ecitizen');
    $tempstore->set('code_verifier', $codeVerifier);
    $tempstore->set('state', $state);
    $tempstore->set('return_origin', $callbackUrl);

    $clientId = $this->oauthConfig['client_id'];
    $redirectUri = $this->oauthConfig['redirect_uri'];

    // Build authorization URL (with PKCE if provided)
    $params = [
        'response_type' => 'code',
        'client_id' => $clientId,
        'redirect_uri' => $redirectUri,
        'scope' => 'openid profile email',
        'code_challenge' => $codeChallenge,
        'code_challenge_method' => 'S256',
        'state' => $state,
    ];

    $authUrl = 'https://accounts.ecitizen.go.ke/oauth/authorize' . '?' . http_build_query($params);

    return new TrustedRedirectResponse($authUrl);
  }

  public function callback(Request $request) {
    $code = $request->query->get('code');
    $state = $request->query->get('state');
    $error = $request->query->get('error');

    \Drupal::logger('ecitizen_auth')->warning('callback initiated. request: @request, code: @code, state: @state, Error: @error', [
        '@request' => $request ?? 'none',
        '@code' => $code ?? 'none',
        '@state' => $state ?? 'none',
        '@error' => $error ?? 'none',
    ]);


    // Handle errors first (like your script does)
    if ($error) {
        $errorDescription = $request->query->get('error_description');

        $redirectUrl = $this->oauthConfig['forntend_url'] . '/auth/ecitizen/callback?' . http_build_query([
          'error' => $error,
          'error_description' => $errorDescription ?? 'Unknown error',
        ]);

        return new TrustedRedirectResponse($redirectUrl);
    }

    if (!$code || !$state) {
        throw new BadRequestHttpException('Missing code or state parameter.');
    }

    $tempstore = \Drupal::service('tempstore.private')->get('api_auth_ecitizen');
    $savedState = $tempstore->get('state');
    $codeVerifier = $tempstore->get('code_verifier');
    $returnOrigin = $tempstore->get('return_origin');

    if (empty($savedState) || $state !== $savedState) {
      \Drupal::logger('api_auth')->error('State mismatch or session expired. Saved: @saved, Received: @received', [
        '@saved' => $savedState ?? 'NULL',
        '@received' => $state ?? 'NULL',
      ]);
      throw new AccessDeniedHttpException('Invalid state. Please try logging in again.');
    }

    $callbackUrl = $returnOrigin ?? '/dashboard';

    $this->clearEcitizenTempstore($tempstore);

    // TOKEN EXCHANGE - Use your working script's logic
    $tokenData = $this->exchangeCodeForToken($code, $codeVerifier);

    if (!$tokenData || empty($tokenData['access_token'])) {
        throw new BadRequestHttpException('Failed to exchange code for token.');
    }

    // GET USER INFO - Use your working script's logic
    $userInfo = $this->getUserInfo($tokenData['access_token']);

    if (empty($userInfo['email'])) {
        throw new BadRequestHttpException('No email provided by eCitizen.');
    }

    // Extract user data (like your script does)
    $fullName = trim(($userInfo['first_name'] ?? '') . ' ' .
                    ($userInfo['last_name'] ?? '') . ' ' .
                    ($userInfo['surname'] ?? ''));
    $idNumber = $userInfo['id_number'] ?? '';
    $mobile = $userInfo['mobile_number'] ?? '';
    $krapin = $userInfo['kra_pin_number'] ?? '';
    $email = $userInfo['email'] ?? '';
    $dob = $userInfo['dob'] ?? '';
    $gender = $userInfo['gender'] ?? '';

    // Find or create user in Drupal
    $user = $this->findOrCreateUser($email, $userInfo);

    // Generate JWT tokens
    $tokens = $this->generateJwtTokens($user);

    // REDIRECT BASED ON ORIGIN (like your script does)
    $redirectUrl = $this->determineRedirectUrl($callbackUrl, $callbackUrl, [
        'access_token' => $tokens['access_token'],
        'refresh_token' => $tokens['refresh_token'],
        // 'name' => urlencode($fullName),
        // 'id' => urlencode($idNumber),
        // 'mobile' => urlencode($mobile),
        // 'krapin' => urlencode($krapin),
        // 'email' => urlencode($email),
        // 'dob' => urlencode($dob),
        // 'gender' => urlencode($gender),
        // 'uid' => $user->id(),
        'callback_url' => urlencode($callbackUrl),
    ]);



    return new TrustedRedirectResponse($redirectUrl);
}

private function clearEcitizenTempstore($tempstore) {
  $tempstore->delete('state');
  $tempstore->delete('code_verifier');
  $tempstore->delete('return_origin');
}

private function determineRedirectUrl($origin, $callbackUrl, $params) {
    // Build base parameters
    $queryParams = http_build_query($params);

    // Route based on origin (like your script does)
    if ($origin === 'http://localhost:3000') {
        return "http://localhost:3000/auth/ecitizen/callback?$queryParams";
    }
    // Default fallback
    return $this->oauthConfig['forntend_url'] . "/auth/ecitizen/callback?$queryParams";
}

  /**
   * Mock authentication for development.
   */
  private function mockAuthentication($code, $state, $callbackUrl) {

    // Create a test user
    $email = 'test.user@ecitizen.go.ke';
    $user = $this->findOrCreateUser($email, [
      'id' => 'mock_ecitizen_id_' . $state,
      'email' => $email,
      'name' => 'Test eCitizen User',
    ]);

    $tokens = $this->generateJwtTokens($user);

    $redirectUrl = $this->oauthConfig['forntend_url'] . '/auth/ecitizen/callback?' . http_build_query([
      'access_token' => $tokens['access_token'],
      'refresh_token' => $tokens['refresh_token'],
      'email' => urlencode($email),
      'uid' => $user->id(),
      'callback' => urlencode($callbackUrl),
      'mock' => 'true', // Flag for debugging
    ]);

    return new TrustedRedirectResponse($redirectUrl);
  }

  /**
   * Check if we should mock the response.
   */
  private function shouldMockResponse() {
    // Mock in development, use real in production
    return \Drupal::request()->getHost() !== 'production-domain.com';
  }

  private function exchangeCodeForToken($code, $codeVerifier = null) {
    $data = [
        'grant_type' => 'authorization_code',
        'code' => $code,
        'redirect_uri' => $this->oauthConfig['redirect_uri'],
        'client_id' => $this->oauthConfig['client_id'],
        'client_secret' => $this->oauthConfig['client_secret'],
    ];

    // Add code_verifier only if provided (like your script does)
    if ($codeVerifier) {
        $data['code_verifier'] = $codeVerifier;
    }

    try {
        $response = \Drupal::httpClient()->post($this->oauthConfig['ecitizen_token_url'], [
            'form_params' => $data,
            'headers' => ['Accept' => 'application/json'],
            'verify' => true,
            'http_errors' => true,
        ]);

        return json_decode($response->getBody(), TRUE);
    } catch (\Exception $e) {
        \Drupal::logger('ecitizen_auth')->error('Token exchange failed: @message', [
          '@message' => $e->getMessage(),
      ]);
      return null;
    }
}

  /**
   * Get user info (from original httpGet).
   */
  private function getUserInfo($accessToken) {

    try {
      $response = \Drupal::httpClient()->get($this->oauthConfig['ecitizen_user_info_url'], [
        'headers' => [
          'Authorization' => 'Bearer ' . $accessToken,
          'Accept' => 'application/json',
        ],
        'verify' => false,
      ]);

      return json_decode($response->getBody(), TRUE);
    } catch (\Exception $e) {
      return null;
      // return ['email' => 'test@example.com']; // Fallback
    }
  }

  /**
   * Find or create user (adapted from original DB logic).
   */
  private function findOrCreateUser($email, $ecitizenData) {
      $user_storage = \Drupal::entityTypeManager()->getStorage('user');

      $users = $user_storage->loadByProperties(['mail' => $email]);
      $user = reset($users);

      if (!$user) {
          $baseUsername = preg_replace('/@.*$/', '', $email);
          $username = $baseUsername;
          $counter = 1;

          while ($user_storage->loadByProperties(['name' => $username])) {
              $username = $baseUsername . '_' . $counter;
              $counter++;
          }

          $user = $user_storage->create([
              'name' => $username,
              'mail' => $email,
              'status' => 1,
              'pass' => \Drupal::service('password_generator')->generate(),
              'init' => $email,
          ]);

          if (isset($ecitizenData['first_name'])) {
              // If you have a name field, set it
              $user->set('field_name', $ecitizenData['first_name']);
          }

          // Store other eCitizen data in user's data field or custom fields
          $userData = [
              'ecitizen' => [
                  'id' => $ecitizenData['id'] ?? '',
                  'id_number' => $ecitizenData['id_number'] ?? '',
                  'mobile_number' => $ecitizenData['mobile_number'] ?? '',
                  'kra_pin_number' => $ecitizenData['kra_pin_number'] ?? '',
                  'dob' => $ecitizenData['dob'] ?? '',
                  'gender' => $ecitizenData['gender'] ?? '',
                  'last_login' => time(),
              ]
          ];

          $user->set('data', $userData);

          $user->save();

          \Drupal::logger('ecitizen_auth')->info('User registered via eCitizen SSO: @email', ['@email' => $email]);

      } else {
          // Update existing user's eCitizen data
          $currentData = $user->get('data')->getValue();
          $userData = !empty($currentData) ? $currentData[0]['value'] : [];

          $userData['ecitizen'] = [
              'id' => $ecitizenData['id'] ?? ($userData['ecitizen']['id'] ?? ''),
              'id_number' => $ecitizenData['id_number'] ?? ($userData['ecitizen']['id_number'] ?? ''),
              'mobile_number' => $ecitizenData['mobile_number'] ?? ($userData['ecitizen']['mobile_number'] ?? ''),
              'kra_pin_number' => $ecitizenData['kra_pin_number'] ?? ($userData['ecitizen']['kra_pin_number'] ?? ''),
              'dob' => $ecitizenData['dob'] ?? ($userData['ecitizen']['dob'] ?? ''),
              'gender' => $ecitizenData['gender'] ?? ($userData['ecitizen']['gender'] ?? ''),
              'last_login' => time(),
          ];

          $user->set('data', $userData);

          \Drupal::logger('api_auth')->info('User logged in via eCitizen SSO: @email', ['@email' => $email]);
      }

      // Update last access time
      $user->setLastAccessTime(time());
      $user->save();

      return $user;
  }

  /**
   * Generate JWT tokens (using your existing service).
   */
  private function generateJwtTokens($user) {
    try {
      $jwtService = \Drupal::service('api_auth.jwt_service');
      $tokens = $jwtService->generateTokens($user);


      return $tokens;
    } catch (\Exception $e) {
      throw new BadRequestHttpException('Authentication service error.');
    }
  }

  /**
   * Store PKCE data (replaces session storage).
   */
  public function storePkce(Request $request) {
    $data = json_decode($request->getContent(), TRUE);

    return new JsonResponse(['status' => "ok: {$data}"]);

    if (empty($data['code_verifier']) || empty($data['state'])) {
      return new JsonResponse(['error' => 'Missing code_verifier or state'], 400);
    }

    // Store in tempstore (Drupal's session alternative)
    $tempstore = \Drupal::service('tempstore.private')->get('ecitizen_oauth');
    $tempstore->set($data['state'], [
      'code_verifier' => $data['code_verifier'],
      'created' => time(),
    ]);


    return new JsonResponse(['status' => 'ok']);
  }

}
