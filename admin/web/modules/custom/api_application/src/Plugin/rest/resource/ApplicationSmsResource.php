<?php

namespace Drupal\api_application\Plugin\rest\resource;

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
    WebSmsConfirmationService $web_sms_confirmation_service
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
    \Drupal::logger('api_application')->info("=== SMS ENDPOINT STARTED ===");
    \Drupal::logger('api_application')->info("Method: POST, Application: @app", ["@app" => $application ?? "NULL"]);

    // Rate limiting check
    if (!$this->checkRateLimit($application)) {
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

      // Step 1: Verify the application exists in Web database
      \Drupal::logger('api_application')->info("Step 1: Verifying application exists: @app", ["@app" => $application]);
      $applicationExists = $this->verifyApplicationExists($application);

      if (!$applicationExists) {
        \Drupal::logger('api_application')->error("Application not found: @app", ["@app" => $application]);
        return new ResourceResponse([
          "error" => "Not found",
          "message" => "Application not found",
        ], 404);
      }

      \Drupal::logger('api_application')->info("Step 2: Calling sendConfirmationSmsToAllMembers for application: @app", ["@app" => $application]);

      // Step 2: Use the Web SMS confirmation service to send to all members
      $results = $this->webSmsConfirmationService->sendConfirmationSmsToAllMembers($application);

      \Drupal::logger('api_application')->info("SMS send result: @success success, @failed failed", [
        "@success" => $results["success"],
        "@failed" => $results["failed"]
      ]);

      $sent = $results["success"];
      $failed = $results["failed"];
      $total = $sent + $failed;

      $isSuccess = ($sent > 0 || ($sent === 0 && $failed === 0));

      $statusType = 'success';
      if ($sent > 0 && $failed > 0) {
          $statusType = 'partial'; // 3 sent, 1 failed
      } elseif ($sent === 0 && $failed > 0) {
          $statusType = 'error';   // 0 sent, 1 failed
      } elseif ($sent === 0 && $failed === 0) {
          $statusType = 'info';    // Already up to date
      }

      // response data
      $responseData = [
        "success" => $isSuccess,
        "message" => $this->formatSmsMessage($sent, $failed),
        "data" => [
          "application_id" => $application,
          "sms_sent" => $sent,
          "sms_failed" => $failed,
          "total_attempted" => $total,
          "status_type" => $statusType,
          "timestamp" => date("c"),
        ],
      ];

      $statusCode = $results["success"] > 0 ? 200 : 500;

      \Drupal::logger('api_application')->info("SMS endpoint completed with status: @status", ["@status" => $statusCode]);

      return new ResourceResponse($responseData, $statusCode);

    } catch (\Exception $e) {
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
  protected function formatSmsMessage($sent, $failed) {
      // Case 1: No members needed notification (All already consented/sent)
      if ($sent === 0 && $failed === 0) {
          return "All eligible members have already been notified. No new SMS were required at this time.";
      }

      // Case 2: Perfect Success
      if ($sent > 0 && $failed === 0) {
          return "Confirmation SMS sent to all pending members successfully.";
      }

      // Case 3: Partial Success (The scenario where 3 sent and 1 failed)
      if ($sent > 0 && $failed > 0) {
          return "Successfully notified $sent members, but $failed attempts failed. Please verify the phone numbers of members marked as 'Failed'.";
      }

      // Case 4: Total Failure (0 sent, >0 failed)
      if ($sent === 0 && $failed > 0) {
          return "Failed to send SMS to $failed members. Please check their contact details and try again.";
      }

      // Fallback
      return "An unexpected error occurred while dispatching SMS notifications.";
  }

  /**
   * Check rate limiting for application.
  */
  protected function checkRateLimit($applicationId) {
      $cache = \Drupal::cache();
      $key = 'sms_rate_limit:' . $applicationId;

      if ($cache->get($key)) {
          return false;
      }

      // set 2-minute rate limit
      $cache->set($key, true, time() + 120);
      return true;
  }

  /**
   * Verify that an application exists in the Web database.
   *
   * @param string $applicationId
   *   The application ID.
   *
   * @return bool
   *   TRUE if application exists, FALSE otherwise.
   */
  protected function verifyApplicationExists($applicationId) {
    try {
      $db = $this->getWebDatabase();

      $application = $db->select('applications', 'a')
        ->fields('a', ['id'])
        ->condition('applicationId', $applicationId)
        ->range(0, 1)
        ->execute()
        ->fetchObject();

      return !empty($application);

    } catch (\Exception $e) {
      \Drupal::logger('api_application')->error("Error verifying application: @error", ["@error" => $e->getMessage()]);
      return false;
    }
  }

  /**
   * Get Web database connection.
   *
   * @return \Drupal\Core\Database\Connection
   *   Database connection.
   */
  protected function getWebDatabase() {
    try {
      // Attempt to get the connection defined in settings.php
      return \Drupal\Core\Database\Database::getConnection('default', 'web');
    }
    catch (\Exception $e) {
      // Log the error to Drupal's watchdog logs
      \Drupal::logger('api_application')->error('Web Database Connection Failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      // Optionally: print to the screen for immediate debugging (Dev only)
      // dump($e->getMessage());

      return NULL;
    }
  }
}
