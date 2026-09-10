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
 * Provides a resource for OTP request via SMS.
 */
#[RestResource(
  id: 'api_otp_request',
  label: new TranslatableMarkup('API OTP Request'),
  uri_paths: [
    'create' => '/api/auth/otp/request',
  ],
)]
class OtpRequestResource extends ResourceBase {

  /**
   * The current request.
   */
  protected Request $currentRequest;

  /**
   * The OTP authentication service.
   */
  protected OtpAuthServiceInterface $otpAuthService;

  /**
   * Constructs an OtpRequestResource object.
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
   * Responds to POST requests to initiate OTP authentication.
   *
   * @param array|null $data
   *   The request data.
   *
   * @return \Drupal\rest\ModifiedResourceResponse
   *   The response containing the OTP request result.
   */
  public function post(?array $data = NULL): ModifiedResourceResponse {
    // Validate required fields.
    if (empty($data['phone_number'])) {
      throw new BadRequestHttpException('Phone number is required.');
    }

    $phone_number = trim($data['phone_number']);
    $email = isset($data['email']) ? trim((string) $data['email']) : NULL;

    // Request OTP via the service (SMS first, email failover).
    $result = $this->otpAuthService->requestOtp($phone_number, $email ?: NULL);

    if (!$result['success']) {
      $this->logger->warning('OTP request failed for phone @phone: @error', [
        '@phone' => $phone_number,
        '@error' => $result['error'],
      ]);

      $payload = [
        'success' => FALSE,
        'error' => $result['error'],
      ];
      if (!empty($result['need_email'])) {
        $payload['need_email'] = TRUE;
      }

      return new ModifiedResourceResponse($payload, 400);
    }

    $this->logger->info('OTP request successful for phone @phone via @channel', [
      '@phone' => $phone_number,
      '@channel' => $result['delivery_channel'] ?? 'sms',
    ]);

    $response = [
      'success' => TRUE,
      'request_id' => $result['request_id'],
      'message' => $result['message'],
      'expires_in' => $result['expires_in'],
      'delivery_channel' => $result['delivery_channel'] ?? 'sms',
    ];
    if (!empty($result['masked_email'])) {
      $response['masked_email'] = $result['masked_email'];
    }

    return new ModifiedResourceResponse($response, 200);
  }

}
