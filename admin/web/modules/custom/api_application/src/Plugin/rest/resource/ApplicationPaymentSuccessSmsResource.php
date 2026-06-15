<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\api_application\Service\WebSmsConfirmationService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Sends payment-success SMS to all group members (server-to-server).
 *
 * @RestResource(
 *   id = "application_payment_success_sms",
 *   label = @Translation("Application Payment Success SMS Resource"),
 *   uri_paths = {
 *     "create" = "/api/v1/application/{application}/payment-success-sms"
 *   }
 * )
 */
class ApplicationPaymentSuccessSmsResource extends ResourceBase {
  // phpcs:disable DrupalPractice.Objects.GlobalDrupal.GlobalDrupal

  /**
   * The Web SMS confirmation service.
   *
   * @var \Drupal\api_application\Service\WebSmsConfirmationService
   */
  protected $webSmsConfirmationService;

  /**
   * Constructs a new ApplicationPaymentSuccessSmsResource.
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
   * Responds to POST requests.
   */
  public function post(Request $request, $application = NULL) {
    $apiKey = $request->headers->get('X-API-Key');
    if (!$this->validateApiKey($apiKey)) {
      return new ResourceResponse([
        'error' => 'Authentication failed',
        'message' => 'Invalid or missing API key',
      ], 401);
    }

    if (empty($application)) {
      return new ResourceResponse([
        'error' => 'Invalid request',
        'message' => 'Application ID is required',
      ], 400);
    }

    if (!$this->checkRateLimit($application)) {
      return new ResourceResponse([
        'error' => 'Rate limit exceeded',
        'message' => 'Please wait before sending more SMS',
      ], 429);
    }

    $payload = json_decode($request->getContent(), TRUE) ?: [];
    $amount = $payload['amount'] ?? $payload['amountExpected'] ?? '0.00';
    $billRefNumber = $payload['bill_ref_number'] ?? $payload['billRefNumber'] ?? '';

    try {
      $results = $this->webSmsConfirmationService->sendPaymentSuccessSmsToAllMembers(
        $application,
        (string) $amount,
        (string) $billRefNumber
      );

      $sent = $results['success'];
      $failed = $results['failed'];
      $disabled = !empty($results['disabled']);

      $statusType = 'success';
      if ($disabled) {
        $statusType = 'disabled';
      }
      elseif ($sent > 0 && $failed > 0) {
        $statusType = 'partial';
      }
      elseif ($sent === 0 && $failed > 0) {
        $statusType = 'error';
      }
      elseif ($sent === 0 && $failed === 0) {
        $statusType = 'info';
      }

      return new ResourceResponse([
        'success' => $disabled || $sent > 0 || ($sent === 0 && $failed === 0),
        'message' => $this->formatMessage($sent, $failed, $disabled),
        'data' => [
          'application_id' => $application,
          'trigger' => 'payment_success',
          'sms_sent' => $sent,
          'sms_failed' => $failed,
          'total_attempted' => $sent + $failed,
          'status_type' => $statusType,
          'timestamp' => date('c'),
        ],
      ], ($sent > 0 || $sent === 0 && $failed === 0 || $disabled) ? 200 : 500);
    }
    catch (\Exception $e) {
      $this->logger->error('Payment success SMS endpoint exception: @message', [
        '@message' => $e->getMessage(),
      ]);

      return new ResourceResponse([
        'error' => 'Internal server error',
        'message' => 'An error occurred while sending payment success SMS',
      ], 500);
    }
  }

  /**
   * Formats response message.
   */
  protected function formatMessage($sent, $failed, $disabled = FALSE) {
    if ($disabled) {
      return 'Payment success SMS notifications are disabled in admin settings.';
    }

    if ($sent === 0 && $failed === 0) {
      return 'No members with phone numbers were found for payment notification.';
    }

    if ($sent > 0 && $failed === 0) {
      return 'Payment success SMS sent to all group members.';
    }

    if ($sent > 0 && $failed > 0) {
      return "Payment success SMS sent to $sent members, but $failed attempts failed.";
    }

    return "Failed to send payment success SMS to $failed members.";
  }

  /**
   * Validates the API key.
   */
  protected function validateApiKey($apiKey): bool {
    if (empty($apiKey)) {
      return FALSE;
    }

    $config = \Drupal::config('api_application.settings');
    $validApiKey = $config->get('api_key');

    return hash_equals($validApiKey ?: '', $apiKey);
  }

  /**
   * Check rate limiting for application.
   */
  protected function checkRateLimit($applicationId) {
    $cache = \Drupal::cache();
    $key = 'sms_rate_limit:payment_success:' . $applicationId;

    if ($cache->get($key)) {
      return FALSE;
    }

    $cache->set($key, TRUE, time() + 120);
    return TRUE;
  }

}

// phpcs:enable DrupalPractice.Objects.GlobalDrupal.GlobalDrupal
