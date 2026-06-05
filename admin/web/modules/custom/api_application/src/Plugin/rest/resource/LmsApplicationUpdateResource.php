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
use Drupal\api_application\ApplicationRejectionReasons;
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
    Connection $database,
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
      // Get the first (and only) matching entity.
      $entity = reset($entities);

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

      // Idempotent: LMS may re-sync a status that Drupal already has.
      if ($current_status === $new_status) {
        if ($new_status === ApplicationStatusConstants::TRAINING && $this->hasTrainingScheduleData($data)) {
          return $this->sendTrainingScheduleNotification($entity, $current_status, $data);
        }

        return $this->createModifiedResponse([
          'success' => TRUE,
          'message' => 'Application status already up to date',
          'data' => [
            'id' => $entity->id(),
            'uuid' => $entity->uuid(),
            'application_id' => $entity->getApplicationId(),
            'status' => $entity->getStatus(),
            'changed' => $entity->getChangedTime(),
          ],
        ], 200);
      }

      $allowed_transitions = Application::getAllowedTransitions();
      if (
        !in_array($new_status, $allowed_transitions[$current_status] ?? [])
        && !$this->isAllowedLmsStatusTransition($current_status, $new_status)
      ) {
        return $this->createModifiedResponse([
          'error' => 'invalid_status_transition',
          'message' => "Invalid status transition from $current_status to $new_status",
        ], 400);
      }

      // 6. Handle rejection-specific fields
      $rejection_reason = $data['rejection_reason'] ?? NULL;
      $rejection_message = $data['rejection_message'] ?? $data['failure_message'] ?? NULL;
      if ($new_status === 'rejected') {
        if (empty($rejection_message)) {
          return $this->createModifiedResponse([
            'error' => 'missing_rejection',
            'message' => "Rejection message is required for rejected status",
          ], 400);
        }
        $rejection_reason = ApplicationRejectionReasons::normalize($rejection_reason);
        $entity->set('rejection_reason', $rejection_reason);
        $entity->set('rejection_message', $rejection_message);
      }
      elseif ($new_status === 'disbursement_failed' && !empty($rejection_message)) {
        $entity->set('rejection_reason', ApplicationRejectionReasons::normalize($rejection_reason));
        $entity->set('rejection_message', $rejection_message);
      }

      // 7. Update and save
      $trainingNotes = $this->buildTrainingScheduleNotes($data);
      $GLOBALS['status_manager_skip_auto_track'] = TRUE;
      $entity->setStatus($new_status);
      $entity->save();
      unset($GLOBALS['status_manager_skip_auto_track']);

      /** @var \Drupal\status_manager\Service\StatusTracker $status_tracker */
      $status_tracker = \Drupal::service('status_manager.status_tracker');
      $status_tracker->logStatusChange(
        $entity,
        'status',
        $current_status,
        $new_status,
        'api',
        'notification',
        $trainingNotes
      );

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
      // Internal numeric ID.
          'id' => $entity->id(),
          'uuid' => $entity->uuid(),
      // Your custom APP-XXXX ID.
          'application_id' => $entity->getApplicationId(),
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
          $errors[] = [
            'application_id' => $update['application_id'] ?? 'unknown',
            'error' => 'Missing application_id or status',
          ];
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

        if ($current_status === $new_status) {
          $results[] = [
            'application_id' => $update['application_id'],
            'success' => TRUE,
            'new_status' => $new_status,
            'message' => 'Already up to date',
          ];
          continue;
        }

        $allowed_transitions = Application::getAllowedTransitions();
        if (
          !in_array($new_status, $allowed_transitions[$current_status] ?? [])
          && !$this->isAllowedLmsStatusTransition($current_status, $new_status)
        ) {
          $errors[] = [
            'application_id' => $update['application_id'],
            'error' => "Invalid transition from $current_status to $new_status",
          ];
          continue;
        }

        // Handle rejection.
        if ($new_status === 'rejected') {
          $rejection_reason = $update['rejection_reason'] ?? NULL;
          $rejection_message = $update['rejection_message'] ?? $update['failure_message'] ?? NULL;
          if (empty($rejection_message)) {
            $errors[] = ['application_id' => $update['application_id'], 'error' => 'Rejection message required'];
            continue;
          }
          $application->set('rejection_reason', ApplicationRejectionReasons::normalize($rejection_reason));
          $application->set('rejection_message', $rejection_message);
        }
        elseif ($new_status === 'disbursement_failed') {
          $rejection_reason = $update['rejection_reason'] ?? NULL;
          $rejection_message = $update['rejection_message'] ?? $update['failure_message'] ?? NULL;
          if (!empty($rejection_message)) {
            $application->set('rejection_reason', ApplicationRejectionReasons::normalize($rejection_reason));
            $application->set('rejection_message', $rejection_message);
          }
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
   * LMS may advance applications to any later workflow stage in one step.
   */
  protected function isAllowedLmsStatusTransition(string $current_status, string $new_status): bool {
    if ($current_status === $new_status) {
      return TRUE;
    }

    if (!in_array($new_status, ApplicationStatusConstants::getAll(), TRUE)) {
      return FALSE;
    }

    $ranks = [
      ApplicationStatusConstants::DRAFT => 0,
      ApplicationStatusConstants::GROUP_MEMBER_CONFIRMATION => 1,
      ApplicationStatusConstants::SUBMITTED => 2,
      ApplicationStatusConstants::CONSTITUENCY_REVIEW => 3,
      ApplicationStatusConstants::APPROVED_BY_CONSTITUENCY => 4,
      ApplicationStatusConstants::UNDER_REVIEW => 5,
      ApplicationStatusConstants::APPROVED => 6,
      ApplicationStatusConstants::PENDING_SECRETARIAT_REVIEW => 7,
      ApplicationStatusConstants::PENDING_FUND_TRANSFER => 8,
      ApplicationStatusConstants::TRAINING => 9,
      ApplicationStatusConstants::PENDING_FINAL_DISBURSEMENT => 10,
      ApplicationStatusConstants::DISBURSED => 11,
      ApplicationStatusConstants::DISBURSEMENT_FAILED => 10,
      ApplicationStatusConstants::REJECTED => 6,
      ApplicationStatusConstants::CLOSED => 12,
    ];

    if ($new_status === ApplicationStatusConstants::REJECTED) {
      return ($ranks[$current_status] ?? 0) < ($ranks[ApplicationStatusConstants::DISBURSED] ?? 11);
    }

    if ($new_status === ApplicationStatusConstants::DISBURSEMENT_FAILED) {
      return in_array($current_status, [
        ApplicationStatusConstants::PENDING_FINAL_DISBURSEMENT,
        ApplicationStatusConstants::DISBURSED,
      ], TRUE);
    }

    if ($new_status === ApplicationStatusConstants::CLOSED) {
      return in_array($current_status, [
        ApplicationStatusConstants::DISBURSED,
        ApplicationStatusConstants::DISBURSEMENT_FAILED,
        ApplicationStatusConstants::REJECTED,
      ], TRUE);
    }

    return ($ranks[$new_status] ?? -1) > ($ranks[$current_status] ?? -1);
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

  /**
   * Checks whether the payload includes training schedule details.
   */
  protected function hasTrainingScheduleData(array $data): bool {
    return !empty($data['training_start_date'])
      || !empty($data['training_end_date'])
      || !empty($data['training_venue'])
      || !empty($data['training_notes']);
  }

  /**
   * Builds a human-readable training schedule note for notifications.
   */
  protected function buildTrainingScheduleNotes(array $data): string {
    if (!$this->hasTrainingScheduleData($data)) {
      return '';
    }

    $parts = [];
    if (!empty($data['training_start_date'])) {
      $parts[] = 'Start: ' . $data['training_start_date'];
    }
    if (!empty($data['training_end_date'])) {
      $parts[] = 'End: ' . $data['training_end_date'];
    }
    if (!empty($data['training_venue'])) {
      $parts[] = 'Venue: ' . $data['training_venue'];
    }
    if (!empty($data['training_notes'])) {
      $parts[] = 'Notes: ' . $data['training_notes'];
    }

    return implode('. ', $parts);
  }

  /**
   * Sends training schedule notifications without changing application status.
   */
  protected function sendTrainingScheduleNotification(ApplicationInterface $entity, string $current_status, array $data): Response {
    $trainingNotes = $this->buildTrainingScheduleNotes($data);

    /** @var \Drupal\status_manager\Service\StatusTracker $status_tracker */
    $status_tracker = \Drupal::service('status_manager.status_tracker');
    $status_tracker->logStatusChange(
      $entity,
      'status',
      $current_status,
      ApplicationStatusConstants::TRAINING,
      'api',
      'notification',
      $trainingNotes
    );

    return $this->createModifiedResponse([
      'success' => TRUE,
      'message' => 'Training schedule notification sent',
      'data' => [
        'id' => $entity->id(),
        'uuid' => $entity->uuid(),
        'application_id' => $entity->getApplicationId(),
        'status' => $entity->getStatus(),
        'changed' => $entity->getChangedTime(),
      ],
    ], 200);
  }

}
