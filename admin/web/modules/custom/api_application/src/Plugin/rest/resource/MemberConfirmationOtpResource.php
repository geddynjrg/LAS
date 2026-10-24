<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\api_application\Service\WebSmsConfirmationService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;

/**
 * Member confirmation OTP send/verify endpoint.
 *
 * @RestResource(
 *   id = "member_confirmation_otp",
 *   label = @Translation("Member Confirmation OTP"),
 *   uri_paths = {
 *     "create" = "/api/v1/application/{application}/member-confirmation/otp"
 *   }
 * )
 */
class MemberConfirmationOtpResource extends ResourceBase {

  /**
   * The web SMS confirmation service.
   *
   * @var \Drupal\api_application\Service\WebSmsConfirmationService
   */
  protected WebSmsConfirmationService $webSmsConfirmationService;

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->getParameter('serializer.formats'),
      $container->get('logger.factory')->get('api_application'),
      $container->get('api_application.web_sms_confirmation')
    );
  }

  /**
   * Constructs the resource.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    $logger,
    WebSmsConfirmationService $web_sms_confirmation_service,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    $this->webSmsConfirmationService = $web_sms_confirmation_service;
  }

  /**
   * Handles OTP send and verify actions.
   */
  public function post(Request $request, $application = NULL) {
    $payload = json_decode($request->getContent(), TRUE) ?: [];
    $action = $payload['action'] ?? '';
    $nationalIdCode = trim((string) ($payload['national_id_code'] ?? ''));

    if (empty($application)) {
      return new ModifiedResourceResponse([
        'success' => FALSE,
        'message' => 'Application ID is required.',
      ], 400);
    }

    if ($nationalIdCode === '') {
      return new ModifiedResourceResponse([
        'success' => FALSE,
        'message' => 'national_id_code is required.',
      ], 400);
    }

    if ($action === 'send') {
      $result = $this->webSmsConfirmationService->sendConfirmationOtpToMember(
        $application,
        $nationalIdCode
      );
      $status = !empty($result['success']) ? 200 : 400;
      return new ModifiedResourceResponse($result, $status);
    }

    if ($action === 'verify') {
      $otpCode = preg_replace('/\D+/', '', (string) ($payload['otp_code'] ?? ''));
      if (!preg_match('/^\d{6}$/', $otpCode)) {
        return new ModifiedResourceResponse([
          'success' => FALSE,
          'message' => 'A valid 6-digit OTP code is required.',
        ], 400);
      }

      $result = $this->webSmsConfirmationService->verifyConfirmationOtp(
        $application,
        $nationalIdCode,
        $otpCode,
        [
          'client' => (string) ($payload['client'] ?? $request->headers->get('X-Uwezo-Client', '')),
          'source_hint' => (string) ($payload['source_hint'] ?? ''),
          'user_agent' => (string) $request->headers->get('User-Agent', ''),
        ]
      );
      $status = !empty($result['success']) ? 200 : 400;
      return new ModifiedResourceResponse($result, $status);
    }

    return new ModifiedResourceResponse([
      'success' => FALSE,
      'message' => 'Unsupported action. Use send or verify.',
    ], 400);
  }

}
