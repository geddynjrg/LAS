<?php
// modules/custom/api_auth/src/Controller/ECitizenOAuthController.php

namespace Drupal\api_auth\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Routing\TrustedRedirectResponse; // Add this
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Handles eCitizen OAuth flow
 */
class ECitizenOAuthController extends ControllerBase {

  /**
   * Configuration (same as original script).
   */
  // protected $config = [
  //   'client_id' => 'b30d441b886d8a1cd539e007bc5a3f40',
  //   'client_secret' => 'fptijPtHhSveQCPlqtoSKicuRRuDHBUw',
  //   'redirect_uri' => 'http://uwezo.ddev.site/api/oauth/ecitizen/callback', // ← UPDATED!
  //   'auth_url' => 'https://accounts.ecitizen.go.ke/oauth/authorize',
  //   'token_url' => 'https://accounts.ecitizen.go.ke/oauth/access-token',
  //   'userinfo_url' => 'https://accounts.ecitizen.go.ke/api/user-info',
  //   'nextjs_url' => 'http://localhost:3000',
  // ];

  protected $config = [
    'client_id' => 'b30d441b886d8a1cd539e007bc5a3f40',
    'client_secret' => 'fptijPtHhSveQCPlqtoSKicuRRuDHBUw',
    'redirect_uri' => 'https://majuu.uwezo.go.ke/api/oauth/ecitizen/callback', // ← MATCHES YOUR WORKING SCRIPT
    'auth_url' => 'https://accounts.ecitizen.go.ke/oauth/authorize',
    'token_url' => 'https://accounts.ecitizen.go.ke/oauth/access-token',
    'userinfo_url' => 'https://accounts.ecitizen.go.ke/api/user-info',
    'nextjs_url' => 'http://localhost:3000',
];

  /**
   * Start OAuth flow (initiate).
   */
  // public function initiate(Request $request) {

  //   $session = $request->getSession();

  //   // Generate PKCE parameters
  //   $codeVerifier = bin2hex(random_bytes(64));
  //   $state = $request->query->get('state') ?: bin2hex(random_bytes(16));
  //   $codeChallenge = $request->query->get('code_challenge');

  //   // If no code_challenge provided, calculate it
  //   if (!$codeChallenge) {
  //     $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
  //   }

  //   // Store PKCE verifier in session
  //   $session->set('ecitizen_pkce_verifier', $codeVerifier);
  //   $session->set('ecitizen_state', $state);

  //   // Store callback URL if provided
  //   if ($callbackUrl = $request->query->get('callback')) {
  //     $session->set('ecitizen_callback', $callbackUrl);
  //   }


  //   // Build authorization URL with PKCE
  //   $params = [
  //     'response_type' => 'code',
  //     'client_id' => $this->config['client_id'],
  //     'redirect_uri' => $this->config['redirect_uri'],
  //     'scope' => 'openid profile email',
  //     'state' => $state,
  //     'code_challenge' => $codeChallenge,
  //     'code_challenge_method' => 'S256',
  //   ];

  //   $authUrl = $this->config['auth_url'] . '?' . http_build_query($params);


  //   return new TrustedRedirectResponse($authUrl);
  // }

// public function initiate(Request $request) {

//   $session = $request->getSession();

//   // Get PKCE parameters from request
//   $codeVerifier = bin2hex(random_bytes(64));
//   $state = $request->query->get('state') ?: bin2hex(random_bytes(16));
//   $codeChallenge = $request->query->get('code_challenge');

//   // If no code_challenge from Next.js, calculate it
//   if (!$codeChallenge) {
//     // Generate a code_verifier and calculate challenge
//     $codeChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
//   }

//   // Store in session
//   $session->set('ecitizen_pkce_verifier', $codeVerifier);
//   $session->set('ecitizen_state', $state);

//   if ($callbackUrl = $request->query->get('callback')) {
//     $session->set('ecitizen_callback', $callbackUrl);
//   }



//   // Build authorization URL WITH PKCE
//   $params = [
//     'response_type' => 'code',
//     'client_id' => $this->config['client_id'],
//     'redirect_uri' => $this->config['redirect_uri'],
//     'scope' => 'openid profile email',
//     'state' => $state,
//     'code_challenge' => $codeChallenge, // ← MUST BE INCLUDED
//     'code_challenge_method' => 'S256', // ← MUST BE INCLUDED
//   ];

//   $authUrl = $this->config['auth_url'] . '?' . http_build_query($params);



//   // Log the actual URL being sent (hide sensitive parts)
//   $debugParams = $params;
//   $debugParams['code_challenge'] = substr($codeChallenge, 0, 20) . '...';

//   return new TrustedRedirectResponse($authUrl);
// }

public function initiate(Request $request) {
    $session = $request->getSession();

    // Get parameters
    $state = $request->query->get('state') ?: bin2hex(random_bytes(16));
    $codeChallenge = $request->query->get('code_challenge');
    $callbackUrl = $request->query->get('callback', '/dashboard');

    // Store origin from the request
    $origin = $request->headers->get('Origin');
    if ($origin) {
        \Drupal::service('tempstore.private')->get('ecitizen_origin')->set($state, $origin);
    }

    // Store callback URL
    \Drupal::service('tempstore.private')->get('ecitizen_oauth')->set($state, [
        'created' => time(),
        'callback_url' => $callbackUrl,
    ]);

    // Build authorization URL (with PKCE if provided)
    $params = [
        'response_type' => 'code',
        'client_id' => $this->config['client_id'],
        'redirect_uri' => $this->config['redirect_uri'],
        'scope' => 'openid profile email',
        'state' => $state,
    ];

    if ($codeChallenge) {
        $params['code_challenge'] = $codeChallenge;
        $params['code_challenge_method'] = 'S256';
    }

    $authUrl = $this->config['auth_url'] . '?' . http_build_query($params);

    return new TrustedRedirectResponse($authUrl);
}

  /**
   * Handle eCitizen callback (main logic from original script).
   */
  // public function callback(Request $request) {

  //   $session = $request->getSession();

  //   $code = $request->query->get('code');
  //   $state = $request->query->get('state');
  //   $error = $request->query->get('error');
  //   $errorDescription = $request->query->get('error_description');

  //   if ($error) {
  //       // Instead of throwing an error, redirect to Next.js with the error
  //       $redirectUrl = $this->config['nextjs_url'] . '/auth/ecitizen/callback?' . http_build_query([
  //           'error' => $error,
  //           'error_description' => $errorDescription ?? 'Unknown error',
  //           'state' => $state,
  //       ]);

  //       return new TrustedRedirectResponse($redirectUrl);
  //   }


  //   if (!$code || !$state) {
  //       throw new BadRequestHttpException('Missing code or state parameter.');
  //   }

  //   // Get stored PKCE data
  //   $tempstore = \Drupal::service('tempstore.private')->get('ecitizen_oauth');
  //   $stored = $tempstore->get($state);

  //   if (!$stored) {
  //     throw new BadRequestHttpException('Invalid or expired state parameter.');
  //   }

  //   $callbackUrl = $stored['callback_url'] ?? '/dashboard';

  //   // IMPORTANT: For now, skip eCitizen token exchange since credentials don't work
  //   // We'll mock the response for development
  //   if ($this->shouldMockResponse()) {
  //     return $this->mockAuthentication($code, $state, $callbackUrl);
  //   }

  //   // Original token exchange code (commented out since it fails)
  //   /*
  //   $tokenData = $this->exchangeCodeForToken($code, $codeVerifier);

  //   if (!$tokenData || empty($tokenData['access_token'])) {
  //     throw new BadRequestHttpException('Failed to exchange code for token.');
  //   }

  //   // Get user info
  //   $userInfo = $this->getUserInfo($tokenData['access_token']);

  //   if (empty($userInfo['email'])) {
  //     throw new BadRequestHttpException('No email provided by eCitizen.');
  //   }

  //   $email = $userInfo['email'];

  //   // Find or create user
  //   $user = $this->findOrCreateUser($email, $userInfo);

  //   // Generate JWT tokens
  //   $tokens = $this->generateJwtTokens($user);
  //   */

  //   // For now, use mock data
  //   $email = 'test.user@ecitizen.go.ke';
  //   $user = $this->findOrCreateUser($email, [
  //     'id' => 'mock_ecitizen_id_' . $state,
  //     'email' => $email,
  //     'name' => 'Mock eCitizen User',
  //   ]);

  //   $tokens = $this->generateJwtTokens($user);

  //   // Redirect to Next.js with tokens
  //   $redirectUrl = $this->config['nextjs_url'] . '/auth/ecitizen/callback?' . http_build_query([
  //     'access_token' => $tokens['access_token'],
  //     'refresh_token' => $tokens['refresh_token'],
  //     'email' => urlencode($email),
  //     'uid' => $user->id(),
  //     'callback' => urlencode($callbackUrl),
  //   ]);

  //   // Clean up
  //   $tempstore->delete($state);


  //   // Use TrustedRedirectResponse for the Next.js redirect
  //   return new TrustedRedirectResponse($redirectUrl);
  // }

  public function callback(Request $request) {
    $code = $request->query->get('code');
    $state = $request->query->get('state');
    $error = $request->query->get('error');

    // Handle errors first (like your script does)
    if ($error) {
        $errorDescription = $request->query->get('error_description');

        $redirectUrl = $this->config['nextjs_url'] . '/auth/ecitizen/callback?' . http_build_query([
          'error' => $error,
          'error_description' => $errorDescription ?? 'Unknown error',
          'state' => $state,
        ]);

        return new TrustedRedirectResponse($redirectUrl);
    }

    if (!$code || !$state) {
        throw new BadRequestHttpException('Missing code or state parameter.');
    }

    // Get stored data from tempstore (like your $_SESSION storage)
    $tempstore = \Drupal::service('tempstore.private')->get('ecitizen_oauth');
    $pkceStore = \Drupal::service('tempstore.private')->get('ecitizen_pkce');
    $originStore = \Drupal::service('tempstore.private')->get('ecitizen_origin');

    $storedData = $tempstore->get($state);
    $codeVerifier = $pkceStore->get($state);
    $origin = $originStore->get($state);

    if (!$storedData) {
        throw new BadRequestHttpException('Invalid or expired state parameter.');
    }

    $callbackUrl = $storedData['callback_url'] ?? '/dashboard';

    // Clean up tempstore
    $tempstore->delete($state);
    $pkceStore->delete($state);
    $originStore->delete($state);

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
    $redirectUrl = $this->determineRedirectUrl($origin, $callbackUrl, [
        'access_token' => $tokens['access_token'],
        'refresh_token' => $tokens['refresh_token'],
        'name' => urlencode($fullName),
        'id' => urlencode($idNumber),
        'mobile' => urlencode($mobile),
        'krapin' => urlencode($krapin),
        'email' => urlencode($email),
        'dob' => urlencode($dob),
        'gender' => urlencode($gender),
        'uid' => $user->id(),
    ]);

    return new TrustedRedirectResponse($redirectUrl);
}

private function determineRedirectUrl($origin, $callbackUrl, $params) {
    // Build base parameters
    $queryParams = http_build_query($params);

    // Route based on origin (like your script does)
    if ($origin === 'http://localhost:3000') {
        return "http://localhost:3000/auth/ecitizen/callback?$queryParams";
    } elseif ($origin === 'http://localhost:3001') {
        return "http://localhost:3001/auth/ecitizen/callback?$queryParams";
    } elseif ($origin === 'https://majuu.uwezo.go.ke') {
        return "https://majuu.uwezo.go.ke$callbackUrl?$queryParams";
    }

    // Default fallback
    return $this->config['nextjs_url'] . "/auth/ecitizen/callback?$queryParams";
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

    $redirectUrl = $this->config['nextjs_url'] . '/auth/ecitizen/callback?' . http_build_query([
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

  /**
   * Exchange code for token (from original httpPost).
   */
  // private function exchangeCodeForToken($code, $codeVerifier) {
  //   try {
  //     $data = [
  //       'grant_type' => 'authorization_code',
  //       'code' => $code,
  //       'redirect_uri' => $this->config['redirect_uri'],
  //       'client_id' => $this->config['client_id'],
  //       'client_secret' => $this->config['client_secret'],
  //       'code_verifier' => $codeVerifier,
  //     ];

  //     $response = \Drupal::httpClient()->post($this->config['token_url'], [
  //       'form_params' => $data,
  //       'headers' => ['Accept' => 'application/json'],
  //       'verify' => false, // For development
  //     ]);

  //     return json_decode($response->getBody(), TRUE);
  //   } catch (\Exception $e) {
  //    return null;
  //   }
  // }

  private function exchangeCodeForToken($code, $codeVerifier = null) {
    $data = [
        'grant_type' => 'authorization_code',
        'code' => $code,
        'redirect_uri' => $this->config['redirect_uri'],
        'client_id' => $this->config['client_id'],
        'client_secret' => $this->config['client_secret'],
    ];

    // Add code_verifier only if provided (like your script does)
    if ($codeVerifier) {
        $data['code_verifier'] = $codeVerifier;
    }

    try {
        $response = \Drupal::httpClient()->post($this->config['token_url'], [
            'form_params' => $data,
            'headers' => ['Accept' => 'application/json'],
            'verify' => true,
        ]);

        return json_decode($response->getBody(), TRUE);
    } catch (\Exception $e) {
        return null;
    }
}

  /**
   * Get user info (from original httpGet).
   */
  private function getUserInfo($accessToken) {

    try {
      $response = \Drupal::httpClient()->get($this->config['userinfo_url'], [
        'headers' => [
          'Authorization' => 'Bearer ' . $accessToken,
          'Accept' => 'application/json',
        ],
        'verify' => false,
      ]);

      return json_decode($response->getBody(), TRUE);
    } catch (\Exception $e) {
      return ['email' => 'test@example.com']; // Fallback
    }
  }

  /**
   * Find or create user (adapted from original DB logic).
   */
  private function findOrCreateUser($email, $ecitizenData) {
    $user_storage = \Drupal::entityTypeManager()->getStorage('user');

    // Try to load by email
    $users = $user_storage->loadByProperties(['mail' => $email]);
    $user = reset($users);

    $isNewUser = false;

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

      // Create user
      $user = $user_storage->create([
        'name' => $username,
        'mail' => $email,
        'status' => 1,
        'pass' => \Drupal::service('password_generator')->generate(),
        'init' => $email,
      ]);

      // Store eCitizen data in user's data field
      $user->set('data', [
        'ecitizen' => [
          'id' => $ecitizenData['id'] ?? '',
          'data' => $ecitizenData,
          'last_login' => time(),
        ]
      ]);

      $user->save();

    } else {
      // Update existing user's eCitizen data
      $userData = $user->get('data')->getValue();
      if (empty($userData)) {
        $userData = [['value' => []]];
      }
      $userData[0]['value']['ecitizen'] = [
        'id' => $ecitizenData['id'] ?? '',
        'data' => $ecitizenData,
        'last_login' => time(),
      ];
      $user->set('data', $userData);

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
