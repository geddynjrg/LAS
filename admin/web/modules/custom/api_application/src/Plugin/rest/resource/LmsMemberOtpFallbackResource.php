<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\api_application\Service\WebSmsConfirmationService;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;

/**
 * LMS constituency-officer fallback for member confirmation OTPs when SMS fails.
 *
 * @RestResource(
 *   id = "lms_member_otp_fallback",
 *   label = @Translation("LMS Member OTP Fallback"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/lms/member-otp-fallback",
 *     "create" = "/api/v1/lms/member-otp-fallback"
 *   }
 * )
 */
class LmsMemberOtpFallbackResource extends ResourceBase {

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
   * List SMS-failed member confirmation OTPs for named constituencies.
   */
  public function get(Request $request) {
    $auth = $this->authorize($request);
    if ($auth !== TRUE) {
      return $auth;
    }

    $names = $this->extractConstituencyNames($request);
    if ($names === []) {
      return new ModifiedResourceResponse([
        'success' => FALSE,
        'message' => 'At least one constituency is required.',
        'items' => [],
      ], 400);
    }

    $items = $this->webSmsConfirmationService->listSmsFailedOtpsForConstituencies($names);
    return new ModifiedResourceResponse([
      'success' => TRUE,
      'items' => $items,
    ], 200);
  }

  /**
   * Record that an LMS officer viewed fallback OTP codes.
   */
  public function post(Request $request) {
    $auth = $this->authorize($request);
    if ($auth !== TRUE) {
      return $auth;
    }

    $payload = json_decode($request->getContent(), TRUE) ?: [];
    $officer = [
      'officer_id' => trim((string) ($payload['officer_id'] ?? '')),
      'officer_name' => trim((string) ($payload['officer_name'] ?? '')),
      'officer_email' => trim((string) ($payload['officer_email'] ?? '')),
      'officer_constituency' => trim((string) ($payload['officer_constituency'] ?? '')),
      'officer_ip' => trim((string) ($payload['officer_ip'] ?? $request->getClientIp() ?? '')),
    ];
    $items = is_array($payload['items'] ?? NULL) ? $payload['items'] : [];

    $result = $this->webSmsConfirmationService->recordOfficerOtpReveal($officer, $items);
    return new ModifiedResourceResponse($result, !empty($result['success']) ? 200 : 400);
  }

  /**
   * Require the loans/LMS API key. Never log the key.
   */
  protected function authorize(Request $request) {
    $apiKey = $request->headers->get('X-API-Key');
    if (empty($apiKey)) {
      return new ModifiedResourceResponse([
        'success' => FALSE,
        'message' => 'Invalid or missing API key',
      ], 401);
    }

    $validApiKey = \Drupal::config('api_application.settings')->get('api_key');
    if (!hash_equals((string) ($validApiKey ?: ''), $apiKey)) {
      return new ModifiedResourceResponse([
        'success' => FALSE,
        'message' => 'Invalid or missing API key',
      ], 401);
    }

    return TRUE;
  }

  /**
   * Parse constituency names from query string.
   */
  protected function extractConstituencyNames(Request $request): array {
    $names = [];
    $all = $request->query->all();
    foreach (['constituencies', 'constituency'] as $key) {
      if (!isset($all[$key])) {
        continue;
      }
      $value = $all[$key];
      if (is_array($value)) {
        foreach ($value as $item) {
          $names[] = (string) $item;
        }
      }
      else {
        foreach (preg_split('/\s*,\s*/', (string) $value) ?: [] as $item) {
          $names[] = $item;
        }
      }
    }

    $names = array_values(array_filter(array_map('trim', $names), static function ($name) {
      return $name !== '';
    }));

    return array_values(array_unique($names));
  }

}
