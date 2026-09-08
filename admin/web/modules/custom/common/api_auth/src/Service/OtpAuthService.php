<?php

namespace Drupal\api_auth\Service;

use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\sms_providers\Service\SmsServiceInterface;
use Drupal\user\UserInterface;

/**
 * Service for OTP-based authentication.
 */
class OtpAuthService implements OtpAuthServiceInterface {

  use StringTranslationTrait;

  // Cache constants.
  public const CACHE_TAG_OTP = 'otp_request';

  public const CACHE_TAG_RATE_LIMIT = 'otp_rate_limit';

  public const CONFIG_MESSAGE_TEMPLATE = 'otp.message_template';

  public const CONFIG_OTP_EXPIRY = 'otp.expiry';

  // Configuration constants.
  public const CONFIG_OTP_LENGTH = 'otp.length';

  public const CONFIG_OTP_MAX_ATTEMPTS = 'otp.max_attempts';

  public const CONFIG_OTP_RATE_LIMIT = 'otp.rate_limit';

  public const CONFIG_IP_RATE_LIMIT = 'otp.ip_rate_limit';

  public const CONFIG_PHONE_FIELD = 'otp.user_phone_field';

  public const CONFIG_USERNAME_PREFIX = 'otp.username_prefix';

  /**
   * The cache backend.
   */
  protected CacheBackendInterface $cache;

  /**
   * The config factory.
   */
  protected ConfigFactoryInterface $configFactory;

  /**
   * The entity type manager.
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * The JWT service.
   */
  protected ApiJwtService $jwtService;

  /**
   * The SMS service.
   */
  protected SmsServiceInterface $smsService;

  /**
   * Constructs an OtpAuthService object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\sms_providers\Service\SmsServiceInterface $sms_service
   *   The SMS service.
   * @param \Drupal\api_auth\Service\ApiJwtService $jwt_service
   *   The JWT service.
   * @param \Drupal\Core\Cache\CacheBackendInterface $cache
   *   The cache backend.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    EntityTypeManagerInterface $entity_type_manager,
    SmsServiceInterface $sms_service,
    ApiJwtService $jwt_service,
    CacheBackendInterface $cache,
  ) {
    $this->configFactory = $config_factory;
    $this->entityTypeManager = $entity_type_manager;
    $this->smsService = $sms_service;
    $this->jwtService = $jwt_service;
    $this->cache = $cache;
  }

  /**
   * {@inheritdoc}
   */
  public function findOrCreateUserByPhone(string $phone_number): UserInterface {
    $config = $this->configFactory->get('api_auth.settings');
    $phone_field = $config->get(self::CONFIG_PHONE_FIELD) ?: 'field_phone_number';

    // Try to find existing user.
    $user_storage = $this->entityTypeManager->getStorage('user');
    $query = $user_storage->getQuery()
      ->condition($phone_field, $phone_number)
      ->condition('status', 1)
      ->accessCheck(FALSE)
      ->range(0, 1);

    $uids = $query->execute();

    if (!empty($uids)) {
      return $user_storage->load(reset($uids));
    }

    // Check if phone number is already used by another user.
    if ($this->phoneNumberExists($phone_number)) {
      throw new \Exception('Phone number is already associated with another account.');
    }

    // Create new user.
    $username_prefix = $config->get(self::CONFIG_USERNAME_PREFIX) ?: 'user_';
    $username = $username_prefix . preg_replace('/[^0-9]/', '', $phone_number);

    // Ensure username is unique.
    $original_username = $username;
    $counter = 1;

    while ($this->usernameExists($username)) {
      $username = $original_username . '_' . $counter;
      ++$counter;
    }

    try {
      $user = $user_storage->create([
        'name' => $username,
        'status' => 1,
        $phone_field => $phone_number,
      ]);

      $user->save();

      return $user;
    }
    catch (\Exception $e) {
      // Handle database constraint violations.
      if (str_contains($e->getMessage(), 'Duplicate entry') || str_contains($e->getMessage(), 'UNIQUE constraint')) {
        throw new \Exception('Phone number is already associated with another account.');
      }

      throw $e;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function isValidPhoneNumber(string $phone_number): bool {
    // Basic phone number validation (international format).
    if (!preg_match('/^\+?[1-9]\d{8,14}$/', $phone_number)) {
      return FALSE;
    }

    return TRUE;
  }

  /**
   * {@inheritdoc}
   */
  public function isValidRequest(string $request_id): bool {
    $cache_data = $this->cache->get($this->getOtpCacheKey($request_id));

    return $cache_data && $cache_data->data;
  }

  /**
   * {@inheritdoc}
   */
  public function requestOtp(string $phone_number): array {
    // Validate phone number format.
    if (!$this->isValidPhoneNumber($phone_number)) {
      return [
        'success' => FALSE,
        'error' => $this->t('Invalid phone number format.'),
      ];
    }

    // Check phone number rate limiting.
    if (!$this->checkRateLimit($phone_number)) {
      return [
        'success' => FALSE,
        'error' => $this->t('Too many requests for this number. Please try again later.'),
      ];
    }

    // Check IP-based rate limiting.
    if (!$this->checkIpRateLimit()) {
      return [
        'success' => FALSE,
        'error' => $this->t('Too many requests from your location. Please try again later.'),
      ];
    }

    $config = $this->configFactory->get('api_auth.settings');

    // Generate OTP code.
    $otp_code = $this->generateOtpCode();

    // Generate unique request ID.
    $request_id = 'otp_req_' . bin2hex(random_bytes(16));

    // Store OTP data in cache.
    $otp_data = [
      'phone_number' => $phone_number,
      'otp_code' => password_hash($otp_code, \PASSWORD_DEFAULT),
      'created' => time(),
      'attempts' => 0,
    ];

    $expiry = $config->get(self::CONFIG_OTP_EXPIRY) ?: 300;
    $this->cache->set(
      $this->getOtpCacheKey($request_id),
      $otp_data,
      time() + $expiry,
      [self::CACHE_TAG_OTP]
    );

    // Send SMS.
    $message_template = $config->get(self::CONFIG_MESSAGE_TEMPLATE) ?: 'Your login code is: [code]';
    $message = str_replace('[code]', $otp_code, $message_template);

    $this->smsService->sendSms($phone_number, $message);
    // Keep the OTP even if the provider HTTP body is not a clean success.
    // EBIS often delivers the SMS anyway; deleting the cache made valid
    // codes look expired.
    $this->updateRateLimit($phone_number);
    $this->updateIpRateLimit();

    return [
      'success' => TRUE,
      'request_id' => $request_id,
      'message' => $this->t('Verification code sent to @phone', [
        '@phone' => $this->maskPhoneNumber($phone_number),
      ]),
      'expires_in' => $expiry,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function verifyOtp(string $request_id, string $otp_code): array {
    // Get OTP data from cache.
    $cache_data = $this->cache->get($this->getOtpCacheKey($request_id));

    if (!$cache_data || !$cache_data->data) {
      return [
        'success' => FALSE,
        'error' => $this->t('Invalid or expired verification code.'),
      ];
    }

    $otp_data = $cache_data->data;
    $config = $this->configFactory->get('api_auth.settings');
    $max_attempts = $config->get(self::CONFIG_OTP_MAX_ATTEMPTS) ?: 3;

    // Check attempt limit.
    if ($otp_data['attempts'] >= $max_attempts) {
      $this->cache->delete($this->getOtpCacheKey($request_id));

      return [
        'success' => FALSE,
        'error' => $this->t('Too many failed attempts. Please request a new code.'),
      ];
    }

    // Verify OTP code.
    if (!password_verify($otp_code, $otp_data['otp_code'])) {
      // Increment attempt count.
      ++$otp_data['attempts'];
      $this->cache->set(
        $this->getOtpCacheKey($request_id),
        $otp_data,
        $cache_data->expire,
        [self::CACHE_TAG_OTP]
      );

      return [
        'success' => FALSE,
        'error' => $this->t('Invalid verification code.'),
      ];
    }

    // OTP verified successfully - clean up cache.
    $this->cache->delete($this->getOtpCacheKey($request_id));

    try {
      // Find or create user.
      $user = $this->findOrCreateUserByPhone($otp_data['phone_number']);

      // Generate JWT tokens.
      $tokens = $this->jwtService->generateTokens($user);

      return [
        'success' => TRUE,
        'access_token' => $tokens['access_token'],
        'refresh_token' => $tokens['refresh_token'],
        'expires_in' => $this->jwtService->getAccessTokenExpiration(),
        'user' => [
          'uid' => (int) $user->id(),
          'phone_number' => $otp_data['phone_number'],
          'created' => $user->isNew(),
        ],
      ];
    }
    catch (\Exception $e) {
      return [
        'success' => FALSE,
        'error' => $e->getMessage(),
      ];
    }
  }

  /**
   * Checks if IP address has exceeded rate limits.
   *
   * @return bool
   *   TRUE if within rate limits, FALSE if exceeded.
   */
  protected function checkIpRateLimit(): bool {
    $request = \Drupal::request();
    $ip_address = $request->getClientIp();

    $config = $this->configFactory->get('api_auth.settings');
    $ip_rate_limit = $config->get(self::CONFIG_IP_RATE_LIMIT) ?: 20;
    $cache_key = 'otp_ip_rate_limit:' . hash('sha256', $ip_address);
    $cache_data = $this->cache->get($cache_key);

    if (!$cache_data) {
      return TRUE;
    }

    return $cache_data->data < $ip_rate_limit;
  }

  /**
   * Checks if a phone number has exceeded rate limits.
   *
   * @param string $phone_number
   *   The phone number to check.
   *
   * @return bool
   *   TRUE if within rate limits, FALSE if exceeded.
   */
  protected function checkRateLimit(string $phone_number): bool {
    $config = $this->configFactory->get('api_auth.settings');
    $rate_limit = $config->get(self::CONFIG_OTP_RATE_LIMIT) ?: 5;

    $cache_key = $this->getRateLimitCacheKey($phone_number);
    $cache_data = $this->cache->get($cache_key);

    if (!$cache_data) {
      return TRUE;
    }

    return $cache_data->data < $rate_limit;
  }

  /**
   * Generates a random OTP code.
   *
   * @return string
   *   The generated OTP code.
   */
  protected function generateOtpCode(): string {
    $config = $this->configFactory->get('api_auth.settings');
    $length = $config->get(self::CONFIG_OTP_LENGTH) ?: 6;

    $max = 10 ** $length - 1;
    $min = 10 ** ($length - 1);

    return (string) random_int($min, $max);
  }

  /**
   * Gets the cache key for an OTP request.
   *
   * @param string $request_id
   *   The request ID.
   *
   * @return string
   *   The cache key.
   */
  protected function getOtpCacheKey(string $request_id): string {
    return 'otp_auth:' . $request_id;
  }

  /**
   * Gets the cache key for rate limiting.
   *
   * @param string $phone_number
   *   The phone number.
   *
   * @return string
   *   The cache key.
   */
  protected function getRateLimitCacheKey(string $phone_number): string {
    return 'otp_rate_limit:' . hash('sha256', $phone_number);
  }

  /**
   * Masks a phone number for display.
   *
   * @param string $phone_number
   *   The phone number to mask.
   *
   * @return string
   *   The masked phone number.
   */
  protected function maskPhoneNumber(string $phone_number): string {
    if (\strlen($phone_number) < 4) {
      return str_repeat('*', \strlen($phone_number));
    }

    $visible_end = substr($phone_number, -4);
    $masked_start = str_repeat('*', \strlen($phone_number) - 4);

    return $masked_start . $visible_end;
  }

  /**
   * Checks if a phone number already exists for any user.
   *
   * @param string $phone_number
   *   The phone number to check.
   *
   * @return bool
   *   TRUE if phone number exists, FALSE otherwise.
   */
  protected function phoneNumberExists(string $phone_number): bool {
    $config = $this->configFactory->get('api_auth.settings');
    $phone_field = $config->get(self::CONFIG_PHONE_FIELD) ?: 'field_phone_number';

    $user_storage = $this->entityTypeManager->getStorage('user');
    $query = $user_storage->getQuery()
      ->condition($phone_field, $phone_number)
      ->accessCheck(FALSE)
      ->range(0, 1);

    $uids = $query->execute();

    return !empty($uids);
  }

  /**
   * Updates the IP rate limit counter.
   */
  protected function updateIpRateLimit(): void {
    $request = \Drupal::request();
    $ip_address = $request->getClientIp();
    $cache_key = 'otp_ip_rate_limit:' . hash('sha256', $ip_address);
    $cache_data = $this->cache->get($cache_key);

    $count = $cache_data ? $cache_data->data + 1 : 1;

    // IP rate limit resets every hour.
    $this->cache->set(
      $cache_key,
      $count,
      time() + 3600,
      [self::CACHE_TAG_RATE_LIMIT]
    );
  }

  /**
   * Updates the rate limit counter for a phone number.
   *
   * @param string $phone_number
   *   The phone number.
   */
  protected function updateRateLimit(string $phone_number): void {
    $cache_key = $this->getRateLimitCacheKey($phone_number);
    $cache_data = $this->cache->get($cache_key);

    $count = $cache_data ? $cache_data->data + 1 : 1;

    // Rate limit resets every hour.
    $this->cache->set(
      $cache_key,
      $count,
      time() + 3600,
      [self::CACHE_TAG_RATE_LIMIT]
    );
  }

  /**
   * Checks if a username already exists.
   *
   * @param string $username
   *   The username to check.
   *
   * @return bool
   *   TRUE if username exists, FALSE otherwise.
   */
  protected function usernameExists(string $username): bool {
    $user_storage = $this->entityTypeManager->getStorage('user');
    $query = $user_storage->getQuery()
      ->condition('name', $username)
      ->accessCheck(FALSE)
      ->range(0, 1);

    $uids = $query->execute();

    return !empty($uids);
  }

}
