<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\rest_framework\Plugin\rest\resource\RestFrameworkResourceBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Database\Connection;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Drupal\api_application\ApplicationStatusConstants;
use Drupal\api_application\Entity\ApplicationInterface;
use Drupal\api_application\Entity\Application;

/**
 * Provides a REST resource for LMS-initiated updates to applications.
 *
 * @RestResource(
 *   id = "lms_application_update",
 *   label = @Translation("LMS Application Update Resource"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/lms/application/{application}",
 *     "create" = "/api/v1/lms/applications/status-batch"
 *   }
 * )
 */
class LmsApplicationUpdateResource extends RestFrameworkResourceBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The database connection.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * Constructs a new LmsApplicationUpdateResource object.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    PathMatcherInterface $path_matcher,
    RestFrameworkFieldMapper $field_mapper,
    LanguageManagerInterface $language_manager,
    AliasManagerInterface $alias_manager,
    EntityTypeManagerInterface $entity_type_manager,
    Connection $database
  ) {
    parent::__construct(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $serializer_formats,
      $logger,
      $path_matcher,
      $field_mapper,
      $language_manager,
      $alias_manager
    );

    $this->entityTypeManager = $entity_type_manager;
    $this->database = $database;
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
      $container->get('logger.factory')->get('rest'),
      $container->get('path.matcher'),
      $container->get('rest_framework.field_mapper'),
      $container->get('language_manager'),
      $container->get('path_alias.manager'),
      $container->get('entity_type.manager'),
      $container->get('database')
    );
  }

  /**
   * Responds to PATCH requests to update a single application (e.g., status).
   *
   * @param string $application
   *   The application ID (your custom application_id string, e.g. "APP-20260206-VOIG7A").
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response object.
   */
  public function patch(string $application, Request $request): Response {
    try {
      $apiKey = $request->headers->get('X-API-Key');
      if (!$this->validateApiKey($apiKey)) {
        return $this->createModifiedResponse([
          'error' => 'Authentication failed',
          'message' => 'Invalid or missing API key',
        ], 401);
      }

      $applicationStorage = $this->entityTypeManager->getStorage('application');
      $entities = $applicationStorage->loadByProperties(['application_id' => $application]);

      if (empty($entities)) {
        $this->logger->warning('Application not found by application_id', ['id' => $application]);
        return $this->createModifiedResponse([
          'error'   => 'not_found',
          'message' => "Application with ID $application not found",
        ], 404);
      }

      /** @var \Drupal\api_application\Entity\ApplicationInterface $entity */
      $entity = reset($entities);  // Get the first (and only) matching entity

      // 3. Get request data
      $data = json_decode($request->getContent(), TRUE);
      if (empty($data)) {
        return $this->createModifiedResponse([
          'error' => 'empty_data',
          'message' => 'Request body cannot be empty',
        ], 400);
      }

      // 4. Validate required fields
      $requiredFields = ['status'];
      $missingFields = [];
      foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
          $missingFields[] = $field;
        }
      }

      if (!empty($missingFields)) {
        return $this->createModifiedResponse([
          'error' => 'missing_fields',
          'message' => 'Missing required fields',
          'missing_fields' => $missingFields,
        ], 400);
      }

      // 5. Validate status transition
      $current_status = $entity->getStatus();
      $new_status = $data['status'];
      $allowed_transitions = Application::getAllowedTransitions();
      if (!in_array($new_status, $allowed_transitions[$current_status] ?? [])) {
        return $this->createModifiedResponse([
          'error' => 'invalid_status_transition',
          'message' => "Invalid status transition from $current_status to $new_status",
        ], 400);
      }

      // 6. Handle rejection-specific fields
      $rejection_reason = $data['rejection_reason'] ?? NULL;
      $rejection_message = $data['rejection_message'] ?? NULL;
      if ($new_status === 'rejected') {
        if (empty($rejection_reason) || empty($rejection_message)) {
          return $this->createModifiedResponse([
            'error' => 'missing_rejection',
            'message' => "Rejection reason and message are required for rejected status",
          ], 400);
        }
        $entity->set('rejection_reason', $rejection_reason);
        $entity->set('rejection_message', $rejection_message);
      }

      // 7. Update and save
      $entity->setStatus($new_status);
      $entity->save();

      // 8. Log the action
      $this->logger->notice('Application @id status changed from @old to @new via LMS API.', [
        '@id' => $entity->getApplicationId(),
        '@old' => $current_status,
        '@new' => $new_status,
      ]);

      // 9. Build success response
      $responseData = [
        'success' => TRUE,
        'message' => 'Application status updated successfully',
        'data' => [
          'id' => $entity->id(),                    // Internal numeric ID
          'uuid' => $entity->uuid(),
          'application_id' => $entity->getApplicationId(),  // Your custom APP-XXXX ID
          'status' => $entity->getStatus(),
          'changed' => $entity->getChangedTime(),
        ],
      ];

      return $this->createModifiedResponse($responseData, 201);
    }
    catch (\Exception $e) {
      $this->logger->error('LMS application update failed: @message', [
        '@message' => $e->getMessage(),
        'application_id' => $application,
      ]);

      return $this->createModifiedResponse([
        'error' => 'Internal server error',
        'message' => 'An error occurred while processing the application',
      ], 500);
    }
  }

  /**
   * Responds to POST requests for batch status updates (multiple applications).
   *
   * Payload example: { "updates": [ { "application_id": "APP-123", "status": "disbursed" }, ... ] }
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   *
   * @return \Drupal\rest\ModifiedResourceResponse
   *   The response with batch results.
   */
  public function post(Request $request): Response {
    try {
      // Check authentication.
      $apiKey = $request->headers->get('X-API-Key');
      if (!$this->validateApiKey($apiKey)) {
        return $this->createModifiedResponse([
          'error' => 'Authentication failed',
          'message' => 'Invalid or missing API key',
        ], 401);
      }

      // Get request data.
      $data = json_decode($request->getContent(), TRUE);
      if (empty($data['updates']) || !is_array($data['updates'])) {
        return $this->createModifiedResponse([
          'error' => 'invalid_payload',
          'message' => 'Invalid batch payload - "updates" array required',
        ], 400);
      }

      $results = [];
      $errors = [];
      $applicationStorage = $this->entityTypeManager->getStorage('application');

      foreach ($data['updates'] as $update) {
        if (empty($update['application_id']) || empty($update['status'])) {
          $errors[] = ['application_id' => $update['application_id'] ?? 'unknown', 'error' => 'Missing application_id or status'];
          continue;
        }

        // Load application by application_id (custom field).
        $applications = $applicationStorage->loadByProperties(['application_id' => $update['application_id']]);
        if (empty($applications)) {
          $errors[] = ['application_id' => $update['application_id'], 'error' => 'Application not found'];
          continue;
        }

        $application = reset($applications);
        $current_status = $application->getStatus();
        $new_status = $update['status'];
        $allowed_transitions = Application::getAllowedTransitions();
        if (!in_array($new_status, $allowed_transitions[$current_status] ?? [])) {
          $errors[] = ['application_id' => $update['application_id'], 'error' => "Invalid transition from $current_status to $new_status"];
          continue;
        }

        // Handle rejection.
        if ($new_status === 'rejected') {
          $rejection_reason = $update['rejection_reason'] ?? NULL;
          $rejection_message = $update['rejection_message'] ?? NULL;
          if (empty($rejection_reason) || empty($rejection_message)) {
            $errors[] = ['application_id' => $update['application_id'], 'error' => 'Rejection reason and message required'];
            continue;
          }
          $application->set('rejection_reason', $rejection_reason);
          $application->set('rejection_message', $rejection_message);
        }

        // Update and save.
        $application->setStatus($new_status);
        $application->save();

        $this->logger->notice('Batch: Application @id status changed from @old to @new via LMS API.', [
          '@id' => $application->getApplicationId(),
          '@old' => $current_status,
          '@new' => $new_status,
        ]);

        $results[] = [
          'application_id' => $update['application_id'],
          'success' => TRUE,
          'new_status' => $new_status,
        ];
      }

      // Build batch response.
      $responseData = [
        'success' => empty($errors),
        'message' => empty($errors) ? 'Batch update completed successfully' : 'Batch update completed with errors',
        'results' => $results,
        'errors' => $errors,
      ];

      return $this->createModifiedResponse($responseData, 201);
    }
    catch (\Exception $e) {
      $this->logger->error('LMS batch update failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      return $this->createModifiedResponse([
        'error' => 'Internal server error',
        'message' => 'An error occurred while processing the application',
      ], 500);
    }
  }

  /**
   * Validates the API key.
   *
   * @param string|null $apiKey
   *   The API key to validate.
   *
   * @return bool
   *   TRUE if valid, FALSE otherwise.
  */
  protected function validateApiKey($apiKey): bool {
    if (empty($apiKey)) {
      return FALSE;
    }

    // Get API key from configuration.
    $config = \Drupal::config('api_application.settings');
    $validApiKey = $config->get('api_key');

    // For security, use constant-time comparison.
    return hash_equals($validApiKey ?: '', $apiKey);
  }

}
