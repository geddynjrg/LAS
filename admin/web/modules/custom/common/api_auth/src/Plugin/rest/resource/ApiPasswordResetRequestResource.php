<?php

namespace Drupal\api_auth\Plugin\rest\resource;

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\rest\Attribute\RestResource;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\user\UserInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

/**
 * Provides a resource for requesting password reset.
 */
#[RestResource(
  id: 'api_password_reset_request',
  label: new TranslatableMarkup('API Password Reset Request'),
  uri_paths: [
    'create' => '/api/v1/user/password/reset-request',
  ],
)]
class ApiPasswordResetRequestResource extends ResourceBase {

  /**
   * The rate limit for password reset requests (per hour).
   */
  public const RATE_LIMIT = 5;

  /**
   * The rate limit window in seconds (1 hour).
   */
  public const RATE_LIMIT_WINDOW = 3600;

  /**
   * Responds to POST requests for password reset request.
   *
   * @param array $data
   *   The request data containing email.
   *
   * @throws \Symfony\Component\HttpKernel\Exception\HttpException
   *
   * @return \Drupal\rest\ModifiedResourceResponse
   *   The HTTP response object.
   */
  public function post(?array $data = NULL) {
    if (empty($data['email'])) {
      throw new BadRequestHttpException('Email is required.');
    }

    $email = $data['email'];

    // Validate email format.
    if (!\Drupal::service('email.validator')->isValid($email)) {
      throw new BadRequestHttpException('Invalid email format.');
    }

    // Check rate limiting.
    $this->checkRateLimit($email);

    // Use Drupal's built-in password reset functionality.
    $user = user_load_by_mail($email);

    if (!$user instanceof UserInterface) {
      // Return success even if user not found.
      $response_data = [
        'data' => [
          'message' => 'If the email exists, a password reset link has been sent.',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];

      return new ModifiedResourceResponse($response_data, 200);
    }

    try {
      // Use Drupal's built-in password reset functionality.
      _user_mail_notify('password_reset', $user);

      // Log the password reset request.
      $this->logger->info('Password reset requested for user @uid', [
        '@uid' => $user->id(),
      ]);

      // Prepare response data.
      $response_data = [
        'data' => [
          'message' => 'If the email exists, a password reset link has been sent.',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];

      return new ModifiedResourceResponse($response_data, 200);
    }
    catch (\Exception $e) {
      // Log the error but don't expose it to the user.
      $this->logger->error('Error sending password reset email: @message', [
        '@message' => $e->getMessage(),
      ]);

      throw new BadRequestHttpException('Unable to process password reset request.');
    }
  }

  /**
   * Checks if the request is within rate limits.
   *
   * @param string $email
   *   The email address to check rate limits for.
   *
   * @throws \Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException
   *   If the rate limit is exceeded.
   */
  protected function checkRateLimit(string $email): void {
    $cache_key = 'api_auth:password_reset:' . md5($email);
    $cache = \Drupal::cache('api_auth');
    $cache_item = $cache->get($cache_key);
    $count = $cache_item ? $cache_item->data : 0;

    if ($count >= self::RATE_LIMIT) {
      throw new TooManyRequestsHttpException(
        self::RATE_LIMIT_WINDOW,
        'Too many password reset requests. Please try again later.'
      );
    }

    // Increment the counter.
    $cache->set($cache_key, $count + 1, \Drupal::time()->getRequestTime() + self::RATE_LIMIT_WINDOW);
  }

}
