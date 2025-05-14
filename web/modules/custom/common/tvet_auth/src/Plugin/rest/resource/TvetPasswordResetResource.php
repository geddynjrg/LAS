<?php

namespace Drupal\tvet_auth\Plugin\rest\resource;

use Drupal\Component\Datetime\TimeInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\rest\Attribute\RestResource;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\user\UserInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Provides a resource for resetting user password.
 */
#[RestResource(
  id: 'tvet_password_reset',
  label: new TranslatableMarkup('TVET Password Reset'),
  uri_paths: [
    'create' => '/api/v1/user/password/reset',
  ],
)]
class TvetPasswordResetResource extends ResourceBase {

  /**
   * Constructs a new TvetPasswordResetResource object.
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
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entityTypeManager
   *   The entity type manager service.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The configuration factory service.
   * @param \Drupal\Component\Datetime\TimeInterface $time
   *   The time service.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected ConfigFactoryInterface $configFactory,
    protected TimeInterface $time,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
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
      $container->get('entity_type.manager'),
      $container->get('config.factory'),
      $container->get('datetime.time')
    );
  }

  /**
   * Responds to POST requests for password reset.
   *
   * @param array $data
   *   The request data containing reset token and new password.
   *
   * @throws \Symfony\Component\HttpKernel\Exception\HttpException
   *
   * @return \Drupal\rest\ModifiedResourceResponse
   *   The HTTP response object.
   */
  public function post(?array $data = NULL) {
    if (empty($data['uid']) || empty($data['timestamp']) || empty($data['hash']) || empty($data['new_password'])) {
      throw new BadRequestHttpException('User ID, timestamp, hash, and new password are required.');
    }

    $uid = $data['uid'];
    $timestamp = $data['timestamp'];
    $hash = $data['hash'];
    $new_password = $data['new_password'];

    // Validate password strength.
    // if (!$this->validatePasswordStrength($new_password)) {
    // throw new BadRequestHttpException('Password does not meet security
    // requirements.'),
    // }.
    try {
      // Load the user.
      $user = $this->entityTypeManager->getStorage('user')->load($uid);

      if (!$user instanceof UserInterface) {
        throw new AccessDeniedHttpException('Invalid user.');
      }

      // Check if the token has expired.
      $timeout = $this->configFactory->get('user.settings')->get('password_reset_timeout');
      $current = $this->time->getRequestTime();

      if ($current - $timestamp > $timeout) {
        throw new AccessDeniedHttpException('Reset token has expired.');
      }

      // Verify the hash.
      if (!hash_equals($hash, user_pass_rehash($user, $timestamp))) {
        throw new AccessDeniedHttpException('Invalid reset token.');
      }

      // Set the new password.
      $user->setPassword($new_password);
      $user->save();

      // Log the password reset.
      $this->logger->info('Password reset completed for user @uid', [
        '@uid' => $user->id(),
      ]);

      // Revoke all existing tokens for this user.
      if ($this->configFactory->get('tvet_auth.settings')->get('jwt_revoke_tokens_on_password_change')) {
        /** @var \Drupal\tvet_auth\Service\TvetJwtService $jwt_service */
        $jwt_service = \Drupal::service('tvet_auth.jwt_service');
        $count = $jwt_service->removeAllUserTokens($user);

        $this->logger->info('Revoked @count tokens for user @uid after password reset', [
          '@uid' => $user->id(),
          '@count' => $count,
        ]);
      }

      // Prepare response data.
      $response_data = [
        'data' => [
          'message' => 'Password has been reset successfully.',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];

      return new ModifiedResourceResponse($response_data, 200);
    }
    catch (\Exception $e) {
      $this->logger->error('Error during password reset: @message', [
        '@message' => $e->getMessage(),
      ]);

      throw new BadRequestHttpException('Unable to reset password.');
    }
  }

  /**
   * Validates password strength.
   *
   * @param string $password
   *   The password to validate.
   *
   * @return bool
   *   TRUE if the password meets security requirements.
   */
  protected function validatePasswordStrength(string $password): bool {
    // Minimum length of 8 characters.
    if (\strlen($password) < 8) {
      return FALSE;
    }

    // Must contain at least one number.
    if (!preg_match('/[0-9]/', $password)) {
      return FALSE;
    }

    // Must contain at least one uppercase letter.
    if (!preg_match('/[A-Z]/', $password)) {
      return FALSE;
    }

    // Must contain at least one lowercase letter.
    if (!preg_match('/[a-z]/', $password)) {
      return FALSE;
    }

    // Must contain at least one special character.
    if (!preg_match('/[^A-Za-z0-9]/', $password)) {
      return FALSE;
    }

    return TRUE;
  }

}
