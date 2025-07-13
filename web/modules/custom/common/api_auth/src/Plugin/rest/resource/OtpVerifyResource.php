<?php

namespace Drupal\api_auth\Plugin\rest\resource;

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\api_auth\Service\OtpAuthServiceInterface;
use Drupal\rest\Attribute\RestResource;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Provides a resource for OTP verification and authentication.
 */
#[RestResource(
  id: 'api_otp_verify',
  label: new TranslatableMarkup('API OTP Verify'),
  uri_paths: [
    'create' => '/api/auth/otp/verify',
  ],
)]
class OtpVerifyResource extends ResourceBase {

  /**
   * The current request.
   */
  protected Request $currentRequest;

  /**
   * The OTP authentication service.
   */
  protected OtpAuthServiceInterface $otpAuthService;

  /**
   * Constructs an OtpVerifyResource object.
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
   * @param \Symfony\Component\HttpFoundation\Request $current_request
   *   The current request.
   * @param \Drupal\api_auth\Service\OtpAuthServiceInterface $otp_auth_service
   *   The OTP authentication service.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    Request $current_request,
    OtpAuthServiceInterface $otp_auth_service,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    $this->currentRequest = $current_request;
    $this->otpAuthService = $otp_auth_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): static {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->getParameter('serializer.formats'),
      $container->get('logger.factory')->get('api_auth'),
      $container->get('request_stack')->getCurrentRequest(),
      $container->get('api_auth.otp_service')
    );
  }

  /**
   * Responds to POST requests to verify OTP and authenticate user.
   *
   * @param array|null $data
   *   The request data.
   *
   * @return \Drupal\rest\ModifiedResourceResponse
   *   The response containing authentication tokens or error.
   */
  public function post(?array $data = NULL): ModifiedResourceResponse {
    // Validate required fields.
    if (empty($data['request_id']) || empty($data['otp_code'])) {
      throw new BadRequestHttpException('Request ID and OTP code are required.');
    }

    $request_id = trim($data['request_id']);
    $otp_code = trim($data['otp_code']);

    // Verify OTP via the service.
    $result = $this->otpAuthService->verifyOtp($request_id, $otp_code);

    if (!$result['success']) {
      $this->logger->warning('OTP verification failed for request @request_id: @error', [
        '@request_id' => $request_id,
        '@error' => $result['error'],
      ]);

      return new ModifiedResourceResponse([
        'success' => FALSE,
        'error' => $result['error'],
      ], 400);
    }

    $this->logger->info('OTP verification successful for request @request_id, user @uid', [
      '@request_id' => $request_id,
      '@uid' => $result['user']['uid'],
    ]);

    return new ModifiedResourceResponse([
      'success' => TRUE,
      'access_token' => $result['access_token'],
      'refresh_token' => $result['refresh_token'],
      'expires_in' => $result['expires_in'],
      'user' => $result['user'],
    ], 200);
  }

}
