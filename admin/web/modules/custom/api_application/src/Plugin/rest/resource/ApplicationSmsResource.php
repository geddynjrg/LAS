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

      // Step 3: Build response data
      $responseData = [
        "success" => $results["success"] > 0,
        "message" => $results["success"] > 0 ?
          "Confirmation SMS sent to {$results["success"]} members" :
          "Failed to send confirmation SMS",
        "data" => [
          "application_id" => $application,
          "sms_sent" => $results["success"],
          "sms_failed" => $results["failed"],
          "trigger" => "member_confirmation",
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
    $webConfig = [
      "database" => "web",
      "username" => "db",
      "password" => "db",
      "host" => "db",
      "port" => "3306",
      "driver" => "mysql",
      "namespace" => "Drupal\\Core\\Database\\Driver\\mysql",
    ];

    \Drupal\Core\Database\Database::addConnectionInfo('web', 'default', $webConfig);
    return \Drupal\Core\Database\Database::getConnection('default', 'web');
  }
}



  // protected function loadApplication($applicationId) {
  //   \Drupal::logger("system")->info("Loading application from Prisma: @app", ["@app" => $applicationId]);

  //   try {
  //     // Prisma database configuration - this works (confirmed via test)
  //     $prisma_config = [
  //       "database" => "web",
  //       "username" => "db",
  //       "password" => "db",
  //       "host" => "db",
  //       "port" => "3306",
  //       "driver" => "mysql",
  //       "namespace" => "Drupal\Core\Database\Driver\mysql",
  //     ];

  //     // Connect to Prisma database
  //     \Drupal\Core\Database\Database::addConnectionInfo("prisma", "default", $prisma_config);
  //     $prisma_db = \Drupal\Core\Database\Database::getConnection("default", "prisma");

  //     // Query the application
  //     $query = $prisma_db->select("applications", "a");
  //     $query->fields("a", ["id", "applicationId", "status", "userId"]);
  //     $query->condition("a.applicationId", $applicationId);
  //     $application = $query->execute()->fetchObject();

  //     if ($application) {
  //       \Drupal::logger("system")->info("Application found: @id", ["@id" => $application->id]);

  //       // Load members with phone numbers
  //       $members_query = $prisma_db->select("member_data", "m");
  //       $members_query->fields("m", ["id", "fullname", "phoneNumber", "nationalIdCode"]);
  //       $members_query->condition("m.applicationId", $application->id);
  //       $members_query->condition("m.phoneNumber", "", "<>");
  //       $members_query->isNotNull("m.phoneNumber");
  //       $members = $members_query->execute()->fetchAll();

  //       \Drupal::logger("system")->info("Found @count members", ["@count" => count($members)]);

  //       return (object) [
  //         "prisma_id" => $application->id,
  //         "application_id" => $application->applicationId,
  //         "status" => $application->status,
  //         "user_id" => $application->userId,
  //         "members" => $members,
  //       ];
  //     } else {
  //       \Drupal::logger("system")->warning("Application not found: @app", ["@app" => $applicationId]);
  //       return NULL;
  //     }

  //   } catch (\Exception $e) {
  //     \Drupal::logger("system")->error("Error: @message", ["@message" => $e->getMessage()]);
  //     return NULL;
  //   }
  // }
