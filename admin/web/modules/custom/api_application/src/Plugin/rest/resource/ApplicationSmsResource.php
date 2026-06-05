<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\Core\Database\Database;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\api_application\Service\WebSmsConfirmationService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides Application SMS Resource for POST operations.
 *
 * @RestResource(
 *   id = "application_sms",
 *   label = @Translation("API Application SMS Resource"),
 *   uri_paths = {
 *     "create" = "/api/v1/application/{application}/send-sms"
 *   }
 * )
 */
class ApplicationSmsResource extends ResourceBase {

  /**
   * Supported SMS trigger types.
   */
  protected const TRIGGER_MEMBER_CONFIRMATION = 'member_confirmation';

  protected const TRIGGER_SUBMISSION_SUCCESS = 'submission_success';

  /**
   * The Web SMS confirmation service.
   *
   * @var \Drupal\api_application\Service\WebSmsConfirmationService
   */
  protected $webSmsConfirmationService;

  /**
   * Constructs a new ApplicationSmsResource.
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
    $payload = json_decode($request->getContent(), TRUE) ?: [];
    $trigger = $payload['trigger'] ?? self::TRIGGER_MEMBER_CONFIRMATION;

    \Drupal::logger('api_application')->info("=== SMS ENDPOINT STARTED ===");
    \Drupal::logger('api_application')->info("Method: POST, Application: @app, Trigger: @trigger", [
      "@app" => $application ?? "NULL",
      "@trigger" => $trigger,
    ]);

    if (!in_array($trigger, [self::TRIGGER_MEMBER_CONFIRMATION, self::TRIGGER_SUBMISSION_SUCCESS], TRUE)) {
      return new ResourceResponse([
        "error" => "invalid_trigger",
        "message" => "Unsupported SMS trigger. Use member_confirmation or submission_success.",
      ], 400);
    }

    // Rate limiting check (separate bucket per trigger type).
    if (!$this->checkRateLimit($application, $trigger)) {
      return new ResourceResponse([
        "error" => "Rate limit exceeded",
        "message" => "Please wait before sending more SMS",
      ], 429);
    }

    try {
      if (empty($application)) {
        \Drupal::logger('api_application')->error("SMS endpoint: Application ID is empty");
        return new ResourceResponse([
          "error" => "Invalid request",
          "message" => "Application ID is required",
        ], 400);
      }

      \Drupal::logger('api_application')->info("Step 1: Verifying application exists: @app", ["@app" => $application]);
      $applicationExists = $this->verifyApplicationExists($application);

      if (!$applicationExists) {
        \Drupal::logger('api_application')->error("Application not found: @app", ["@app" => $application]);
        return new ResourceResponse([
          "error" => "Not found",
          "message" => "Application not found",
        ], 404);
      }

      if ($trigger === self::TRIGGER_SUBMISSION_SUCCESS) {
        \Drupal::logger('api_application')->info("Step 2: Sending submission success SMS for application: @app", ["@app" => $application]);
        $results = $this->webSmsConfirmationService->sendSubmissionSuccessSmsToAllMembers($application);
      }
      else {
        \Drupal::logger('api_application')->info("Step 2: Sending member confirmation SMS for application: @app", ["@app" => $application]);
        $results = $this->webSmsConfirmationService->sendConfirmationSmsToAllMembers($application);
      }

      \Drupal::logger('api_application')->info("SMS send result: @success success, @failed failed", [
        "@success" => $results["success"],
        "@failed" => $results["failed"],
      ]);

      $sent = $results["success"];
      $failed = $results["failed"];
      $total = $sent + $failed;
      $disabled = !empty($results['disabled']);

      $isSuccess = $disabled || $sent > 0 || ($sent === 0 && $failed === 0);

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

      $responseData = [
        "success" => $isSuccess,
        "message" => $this->formatSmsMessage($sent, $failed, $trigger, $disabled),
        "data" => [
          "application_id" => $application,
          "trigger" => $trigger,
          "sms_sent" => $sent,
          "sms_failed" => $failed,
          "total_attempted" => $total,
          "status_type" => $statusType,
          "timestamp" => date("c"),
        ],
      ];

      $statusCode = ($sent > 0 || $sent === 0 && $failed === 0 || $disabled) ? 200 : 500;

      \Drupal::logger('api_application')->info("SMS endpoint completed with status: @status", ["@status" => $statusCode]);

      return new ResourceResponse($responseData, $statusCode);

    }
    catch (\Exception $e) {
      \Drupal::logger('api_application')->error("SMS endpoint exception: @message - @trace", [
        "@message" => $e->getMessage(),
        "@trace" => $e->getTraceAsString(),
      ]);

      return new ResourceResponse([
        "error" => "Internal server error",
        "message" => "An error occurred while sending SMS",
      ], 500);
    }
  }

  /**
   * Formats a user-friendly message based on SMS dispatch results.
   */
  protected function formatSmsMessage($sent, $failed, $trigger, $disabled = FALSE) {
    if ($disabled) {
      return "Submission success SMS notifications are disabled in admin settings.";
    }

    if ($trigger === self::TRIGGER_SUBMISSION_SUCCESS) {
      if ($sent === 0 && $failed === 0) {
        return "No members with phone numbers were found for submission notification.";
      }

      if ($sent > 0 && $failed === 0) {
        return "Submission success SMS sent to all group members.";
      }

      if ($sent > 0 && $failed > 0) {
        return "Submission success SMS sent to $sent members, but $failed attempts failed.";
      }

      if ($sent === 0 && $failed > 0) {
        return "Failed to send submission success SMS to $failed members.";
      }

      return "An unexpected error occurred while dispatching submission success SMS.";
    }

    if ($sent === 0 && $failed === 0) {
      return "All eligible members have already been notified. No new SMS were required at this time.";
    }

    if ($sent > 0 && $failed === 0) {
      return "Confirmation SMS sent to all pending members successfully.";
    }

    if ($sent > 0 && $failed > 0) {
      return "Successfully notified $sent members, but $failed attempts failed. Please verify the phone numbers of members marked as 'Failed'.";
    }

    if ($sent === 0 && $failed > 0) {
      return "Failed to send SMS to $failed members. Please check their contact details and try again.";
    }

    return "An unexpected error occurred while dispatching SMS notifications.";
  }

  /**
   * Check rate limiting for application.
   */
  protected function checkRateLimit($applicationId, $trigger) {
    $cache = \Drupal::cache();
    $key = 'sms_rate_limit:' . $trigger . ':' . $applicationId;

    if ($cache->get($key)) {
      return FALSE;
    }

    // Set 2-minute rate limit per trigger type.
    $cache->set($key, TRUE, time() + 120);
    return TRUE;
  }

  /**
   * Verify that an application exists in the Web database.
   */
  protected function verifyApplicationExists($applicationId) {
    try {
      \Drupal::logger('api_application')->info("Verifying application ID: '@id'", ['@id' => $applicationId]);
      $db = $this->getWebDatabase();

      if (!$db) {
        \Drupal::logger('api_application')->error("Web DB connection is NULL");
        return FALSE;
      }

      $application = $db->select('applications', 'a')
        ->fields('a', ['id'])
        ->condition('applicationId', $applicationId)
        ->range(0, 1)
        ->execute()
        ->fetchObject();

      return !empty($application);

    }
    catch (\Exception $e) {
      \Drupal::logger('api_application')->error("Error verifying application: @error", ["@error" => $e->getMessage()]);
      return FALSE;
    }
  }

  /**
   * Get Web database connection.
   */
  protected function getWebDatabase() {
    try {
      return Database::getConnection('default', 'web');
    }
    catch (\Exception $e) {
      \Drupal::logger('api_application')->error('Web Database Connection Failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      return NULL;
    }
  }

}
