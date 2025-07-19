<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\rest_framework\Plugin\rest\resource\RestFrameworkResourceBase;
use Drupal\user\UserInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Psr\Log\LoggerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;
use Drupal\Core\Database\Connection;

/**
 * Provides Application Resource for POST operations.
 *
 * @RestResource(
 *   id = "application_post",
 *   label = @Translation("API Application POST Resource"),
 *   uri_paths = {
 *     "create" = "/api/v1/application"
 *   }
 * )
 */
class ApplicationResource extends RestFrameworkResourceBase {

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
   * Constructs a new ApplicationResource object.
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
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger, $path_matcher, $field_mapper, $language_manager, $alias_manager);
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
      $container->get('logger.factory')->get('rest_framework'),
      $container->get('path.matcher'),
      $container->get('rest_framework.field_mapper'),
      $container->get('language_manager'),
      $container->get('path_alias.manager'),
      $container->get('entity_type.manager'),
      $container->get('database')
    );
  }

  /**
   * Responds to POST requests.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response object.
   */
  public function post(Request $request): Response {
    try {
      // Check authentication via API key header.
      $apiKey = $request->headers->get('X-API-Key');
      if (!$this->validateApiKey($apiKey)) {
        return $this->createModifiedResponse([
          'error' => 'Authentication failed',
          'message' => 'Invalid or missing API key',
        ], 401);
      }

      // Get request data.
      $data = json_decode($request->getContent(), TRUE);

      if (empty($data)) {
        return $this->createModifiedResponse([
          'error' => 'Invalid request',
          'message' => 'Request body cannot be empty',
        ], 400);
      }

      // Validate required fields.
      $requiredFields = [
        'group_name',
        'group_registration_number',
        'date_registered',
        'owner_email',
      ];

      $missingFields = [];
      foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
          $missingFields[] = $field;
        }
      }

      if (!empty($missingFields)) {
        return $this->createModifiedResponse([
          'error' => 'Validation failed',
          'message' => 'Missing required fields',
          'missing_fields' => $missingFields,
        ], 400);
      }

      // Find or create the owner user.
      $owner = $this->findOrCreateUser($data['owner_email']);
      if (!$owner) {
        return $this->createModifiedResponse([
          'error' => 'User error',
          'message' => 'Could not find or create user with email: ' . $data['owner_email'],
        ], 400);
      }

      // Check if application already exists.
      $application = $this->findExistingApplication($data);

      if ($application) {
        // Update existing application.
        $application = $this->updateApplication($application, $data, $owner);
        $message = 'Application updated successfully';
      }
      else {
        // Create new application.
        $application = $this->createApplication($data, $owner);
        $message = 'Application created successfully';
      }

      // Build response.
      $responseData = [
        'success' => TRUE,
        'message' => $message,
        'data' => [
          'id' => $application->id(),
          'uuid' => $application->uuid(),
          'application_id' => $application->getApplicationId(),
          'status' => $application->getStatus(),
          'group_name' => $application->getGroupName(),
          'created' => $application->getCreatedTime(),
          'changed' => $application->getChangedTime(),
        ],
      ];

      return $this->createModifiedResponse($responseData, 201);

    }
    catch (\Exception $e) {
      $this->logger->error('Application creation/update failed: @message', [
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
  protected function validateApiKey($apiKey) {
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
   * Finds or creates a user based on email.
   *
   * @param string $email
   *   The email address.
   *
   * @return \Drupal\user\UserInterface|null
   *   The user entity or NULL.
   */
  protected function findOrCreateUser($email) {
    $userStorage = $this->entityTypeManager->getStorage('user');

    // Try to find existing user.
    $users = $userStorage->loadByProperties(['mail' => $email]);
    if (!empty($users)) {
      return reset($users);
    }

    // Create new user.
    try {
      $user = $userStorage->create([
        'name' => $email,
        'mail' => $email,
        'status' => 1,
        'roles' => ['authenticated'],
      ]);
      $user->save();
      return $user;
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to create user: @message', [
        '@message' => $e->getMessage(),
      ]);
      return NULL;
    }
  }

  /**
   * Finds an existing application.
   *
   * @param array $data
   *   The application data.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface|null
   *   The application entity or NULL.
   */
  protected function findExistingApplication(array $data) {
    $applicationStorage = $this->entityTypeManager->getStorage('application');

    // First try to find by application_id if provided.
    if (!empty($data['application_id'])) {
      $applications = $applicationStorage->loadByProperties([
        'application_id' => $data['application_id'],
      ]);
      if (!empty($applications)) {
        return reset($applications);
      }
    }

    // Try to find by group registration number.
    if (!empty($data['group_registration_number'])) {
      $applications = $applicationStorage->loadByProperties([
        'group_registration_number' => $data['group_registration_number'],
      ]);
      if (!empty($applications)) {
        return reset($applications);
      }
    }

    return NULL;
  }

  /**
   * Creates a new application.
   *
   * @param array $data
   *   The application data.
   * @param \Drupal\user\UserInterface $owner
   *   The owner user.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The created application.
   */
  protected function createApplication(array $data, UserInterface $owner) {
    $applicationStorage = $this->entityTypeManager->getStorage('application');

    $values = [
      'uid' => $owner->id(),
      'status' => $data['status'] ?? 'draft',
    ];

    // Map fields without files first.
    $mappedFields = $this->mapApplicationFields($data);
    $values = array_merge($values, $mappedFields);
    $application = $applicationStorage->create($values);
    $application->save();

    // Now process files with the application ID.
    $fileFields = [
      'group_registration_certificate',
      'list_of_members_certificate',
    ];

    $hasFileUpdates = FALSE;
    foreach ($fileFields as $field) {
      if (isset($data[$field])) {
        $fileId = $this->processFileField($data[$field], $application->getApplicationId());
        if ($fileId && $fileId !== $application->get($field)->target_id) {
          $application->set($field, $fileId);
          $hasFileUpdates = TRUE;
        }
      }
    }

    // Handle multi-value file field (group_credit_history).
    if (isset($data['group_credit_history'])) {
      $creditHistoryIds = [];
      $creditHistoryFiles = is_array($data['group_credit_history']) && isset($data['group_credit_history'][0])
        ? $data['group_credit_history']
        : [$data['group_credit_history']];

      foreach ($creditHistoryFiles as $fileData) {
        $fileId = $this->processFileField($fileData, $application->getApplicationId());
        if ($fileId) {
          $creditHistoryIds[] = $fileId;
        }
      }

      if (!empty($creditHistoryIds)) {
        $application->set('group_credit_history', $creditHistoryIds);
        $hasFileUpdates = TRUE;
      }
    }

    if ($hasFileUpdates) {
      $application->save();
    }

    // Handle group members if provided.
    if (!empty($data['group_members'])) {
      $this->processGroupMembers($application, $data['group_members']);
    }

    return $application;
  }

  /**
   * Updates an existing application.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application to update.
   * @param array $data
   *   The application data.
   * @param \Drupal\user\UserInterface $owner
   *   The owner user.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The updated application.
   */
  protected function updateApplication($application, array $data, UserInterface $owner) {
    // Update owner if different.
    if ($application->getOwnerId() != $owner->id()) {
      $application->setOwnerId($owner->id());
    }

    // Map and update fields.
    $mappedData = $this->mapApplicationFields($data, $application);
    foreach ($mappedData as $field => $value) {
      if ($application->hasField($field)) {
        $application->set($field, $value);
      }
    }

    $application->save();

    // Handle group members if provided.
    if (isset($data['group_members'])) {
      $this->processGroupMembers($application, $data['group_members']);
    }

    return $application;
  }

  /**
   * Maps application fields from request data.
   *
   * @param array $data
   *   The request data.
   * @param \Drupal\api_application\Entity\ApplicationInterface|null $application
   *   The application entity if updating existing.
   *
   * @return array
   *   The mapped field values.
   */
  protected function mapApplicationFields(array $data, $application = NULL) {
    $mapped = [];
    $mapped['application_id'] = $data['application_id'] ?? NULL;

    // Simple text fields.
    $textFields = [
      'group_name',
      'group_registration_number',
      'date_registered',
      'ward',
      'meeting_point',
      'nearest_landmark',
      'table_banking_duration',
      'other_activities',
      'bank_branch',
      'bank_account_number',
    ];

    foreach ($textFields as $field) {
      if (isset($data[$field])) {
        $mapped[$field] = $data[$field];
      }
    }

    // Integer fields.
    $integerFields = [
      'monthly_share_contribution',
      'total_amount_loaned',
      'total_revolving_fund',
      'loan_amount',
      'proposed_repayment_period',
      'average_income',
    ];

    foreach ($integerFields as $field) {
      if (isset($data[$field])) {
        $mapped[$field] = (int) $data[$field];
      }
    }

    // Decimal fields.
    if (isset($data['years_in_operation'])) {
      $mapped['years_in_operation'] = (float) $data['years_in_operation'];
    }

    // List fields.
    $listFields = [
      'nature_of_group',
      'nature_of_business',
      'rejection_reason',
    ];

    foreach ($listFields as $field) {
      if (isset($data[$field])) {
        $mapped[$field] = $data[$field];
      }
    }

    // Multi-value list fields.
    if (isset($data['key_activities'])) {
      $mapped['key_activities'] = (array) $data['key_activities'];
    }

    // Text field.
    if (isset($data['rejection_message'])) {
      $mapped['rejection_message'] = $data['rejection_message'];
    }

    // Taxonomy reference fields.
    $taxonomyFields = [
      'group_background' => 'group_background',
      'value_chain' => 'value_chain',
      'county' => 'counties',
      'constituency' => 'constituencies',
      'purpose_of_loan' => 'purpose_of_the_loan',
      'loan_type' => 'loan_types',
      'bank_name' => 'banks',
      'business_type' => 'business_types',
    ];

    foreach ($taxonomyFields as $field => $vocabulary) {
      if (isset($data[$field])) {
        $mapped[$field] = $this->resolveTaxonomyReferences($data[$field], $vocabulary);
      }
    }

    // File fields - use application ID if available.
    $applicationId = $application ? $application->getApplicationId() : NULL;
    $fileFields = [
      'group_registration_certificate',
      'list_of_members_certificate',
    ];

    foreach ($fileFields as $field) {
      if (isset($data[$field])) {
        $fileId = $this->processFileField($data[$field], $applicationId);
        if ($fileId) {
          $mapped[$field] = $fileId;
        }
      }
    }

    // Multi-value file field (group_credit_history).
    if (isset($data['group_credit_history'])) {
      $mapped['group_credit_history'] = [];
      // Handle both single file and array of files.
      $creditHistoryFiles = is_array($data['group_credit_history']) && isset($data['group_credit_history'][0])
        ? $data['group_credit_history']
        : [$data['group_credit_history']];

      foreach ($creditHistoryFiles as $fileData) {
        $fileId = $this->processFileField($fileData, $applicationId);
        if ($fileId) {
          $mapped['group_credit_history'][] = $fileId;
        }
      }
    }

    // Expenses field (map).
    if (isset($data['expenses'])) {
      // The map field with unlimited cardinality expects an array of maps
      // Each map item will be stored as a delta.
      if (is_array($data['expenses']) && isset($data['expenses'][0])) {
        // Check if it's already in the correct format.
        if (isset($data['expenses'][0]['value'])) {
          // Already in correct format.
          $mapped['expenses'] = $data['expenses'];
        }
        else {
          // It's an array but not in map format, assume it's a single map.
          $expenses_array = [];
          foreach ($data['expenses'][0] as $key => $value) {
            $expenses_array[] = [
              'value' => [$key => $value],
            ];
          }
          $mapped['expenses'] = $expenses_array;
        }
      }
      else {
        $mapped['expenses'] = [];
      }
    }

    return $mapped;
  }

  /**
   * Resolves taxonomy references from names or IDs.
   *
   * @param mixed $value
   *   The value(s) to resolve. Can be string, int, or array.
   * @param string $vocabulary
   *   The vocabulary machine name.
   *
   * @return array|int|null
   *   The term ID(s) or NULL.
   */
  protected function resolveTaxonomyReferences($value, $vocabulary) {
    $termStorage = $this->entityTypeManager->getStorage('taxonomy_term');

    // Handle array of values.
    if (is_array($value)) {
      $tids = [];
      foreach ($value as $item) {
        $tid = $this->resolveSingleTaxonomyReference($item, $vocabulary, $termStorage);
        if ($tid) {
          $tids[] = $tid;
        }
      }
      return $tids;
    }

    // Handle single value.
    return $this->resolveSingleTaxonomyReference($value, $vocabulary, $termStorage);
  }

  /**
   * Resolves a single taxonomy reference.
   *
   * @param mixed $value
   *   The value to resolve.
   * @param string $vocabulary
   *   The vocabulary machine name.
   * @param \Drupal\Core\Entity\EntityStorageInterface $termStorage
   *   The term storage.
   *
   * @return int|null
   *   The term ID or NULL.
   */
  protected function resolveSingleTaxonomyReference($value, $vocabulary, $termStorage) {
    if (empty($value)) {
      return NULL;
    }

    // If numeric, assume it's a TID.
    if (is_numeric($value)) {
      $term = $termStorage->load($value);
      if ($term && $term->bundle() === $vocabulary) {
        return (int) $value;
      }
    }

    // Try to find by name.
    $terms = $termStorage->loadByProperties([
      'name' => $value,
      'vid' => $vocabulary,
    ]);

    if (!empty($terms)) {
      $term = reset($terms);
      return $term->id();
    }

    // Create the term if it doesn't exist for any vocabulary.
    try {
      $term = $termStorage->create([
        'vid' => $vocabulary,
        'name' => $value,
      ]);
      $term->save();

      $this->logger->info('Created new taxonomy term "@name" in vocabulary "@vocab"', [
        '@name' => $value,
        '@vocab' => $vocabulary,
      ]);

      return $term->id();
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to create taxonomy term "@name" in vocabulary "@vocab": @message', [
        '@name' => $value,
        '@vocab' => $vocabulary,
        '@message' => $e->getMessage(),
      ]);
    }

    return NULL;
  }

  /**
   * Processes file field data.
   *
   * @param mixed $value
   *   The file data (base64, UUID, or FID).
   * @param string|null $applicationId
   *   The application ID for organizing files.
   *
   * @return int|null
   *   The file ID or NULL.
   */
  protected function processFileField($value, $applicationId = NULL) {
    if (empty($value)) {
      return NULL;
    }

    // If numeric, assume it's a FID.
    if (is_numeric($value)) {
      return (int) $value;
    }

    // If it's a string, check if it's a UUID.
    if (is_string($value) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value)) {
      $fileStorage = $this->entityTypeManager->getStorage('file');
      $files = $fileStorage->loadByProperties(['uuid' => $value]);
      if (!empty($files)) {
        $file = reset($files);
        return $file->id();
      }
    }

    // Handle base64 encoded files (array with 'data' and 'filename').
    if (is_array($value) && isset($value['data']) && isset($value['filename'])) {
      return $this->createFileFromBase64($value['data'], $value['filename'], $applicationId);
    }

    return NULL;
  }

  /**
   * Creates a file from base64 data.
   *
   * @param string $base64Data
   *   The base64 encoded file data.
   * @param string $filename
   *   The filename.
   * @param string|null $applicationId
   *   The application ID for organizing files.
   *
   * @return int|null
   *   The file ID or NULL.
   */
  protected function createFileFromBase64($base64Data, $filename, $applicationId = NULL) {
    try {
      $data = base64_decode($base64Data, TRUE);
      if ($data === FALSE) {
        return NULL;
      }

      // Determine directory based on application ID and file type.
      if ($applicationId) {
        $directory = 'public://applications/' . $applicationId . '/uploads/' . date('Y-m');
      }
      else {
        // Fallback for files uploaded before application is created.
        $directory = 'public://applications/temp/' . date('Y-m-d');
      }

      \Drupal::service('file_system')->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY);

      // Save the file.
      $file = \Drupal::service('file.repository')->writeData($data, $directory . '/' . $filename, FileSystemInterface::EXISTS_RENAME);

      if ($file) {
        return $file->id();
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Failed to create file from base64: @message', [
        '@message' => $e->getMessage(),
      ]);
    }

    return NULL;
  }

  /**
   * Processes group members for an application.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   * @param array $membersData
   *   The group members data.
   */
  protected function processGroupMembers($application, array $membersData) {
    $groupMemberStorage = $this->entityTypeManager->getStorage('group_member');

    // Load existing members directly from database to avoid duplicates.
    $existingMembers = $groupMemberStorage->loadByProperties([
      'application' => $application->id(),
    ]);
    $existingMemberIds = [];
    foreach ($existingMembers as $member) {
      $existingMemberIds[$member->getIdNumber()] = $member;
    }

    $processedIds = [];
    $memberIds = [];

    foreach ($membersData as $memberData) {
      if (empty($memberData['id_number'])) {
        continue;
      }

      $idNumber = $memberData['id_number'];
      $processedIds[] = $idNumber;

      // Check if member already exists.
      if (isset($existingMemberIds[$idNumber])) {
        // Update existing member.
        $this->updateGroupMember($existingMemberIds[$idNumber], $memberData);
        $memberIds[] = $existingMemberIds[$idNumber]->id();
      }
      else {
        // Create new member.
        $member = $this->createGroupMember($application, $memberData);
        if ($member) {
          $memberIds[] = $member->id();
        }
      }
    }

    // Remove members that are no longer in the data.
    foreach ($existingMemberIds as $idNumber => $member) {
      if (!in_array($idNumber, $processedIds)) {
        $member->delete();
      }
    }

    // Set all member IDs at once using proper entity reference format.
    $references = [];
    foreach ($memberIds as $memberId) {
      $references[] = ['target_id' => $memberId];
    }
    $application->set('group_members', $references);
    $application->save();
  }

  /**
   * Creates a new group member.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   * @param array $data
   *   The member data.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The created member.
   */
  protected function createGroupMember($application, array $data) {
    $groupMemberStorage = $this->entityTypeManager->getStorage('group_member');

    $values = [
      'application' => $application->id(),
      'name' => $data['name'],
      'id_number' => $data['id_number'],
      'gender' => $data['gender'],
      'phone_number' => $data['phone_number'],
    ];

    // Handle position taxonomy reference.
    if (isset($data['position'])) {
      $values['position'] = $this->resolveTaxonomyReferences($data['position'], 'position_of_member');
    }

    // Boolean fields.
    if (isset($data['person_with_disability'])) {
      $values['person_with_disability'] = (bool) $data['person_with_disability'];
    }

    // Optional text field.
    if (isset($data['pwd_number'])) {
      $values['pwd_number'] = $data['pwd_number'];
    }

    // File fields.
    if (isset($data['photo_member_id'])) {
      $fileId = $this->processFileField($data['photo_member_id'], $application->getApplicationId());
      if ($fileId) {
        $values['photo_member_id'] = $fileId;
      }
    }

    if (isset($data['certificate_disability'])) {
      $fileId = $this->processFileField($data['certificate_disability'], $application->getApplicationId());
      if ($fileId) {
        $values['certificate_disability'] = $fileId;
      }
    }

    $member = $groupMemberStorage->create($values);
    $member->save();

    return $member;
  }

  /**
   * Updates an existing group member.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The member to update.
   * @param array $data
   *   The member data.
   */
  protected function updateGroupMember($member, array $data) {
    // Update simple fields.
    $fields = ['name', 'gender', 'phone_number', 'pwd_number'];
    foreach ($fields as $field) {
      if (isset($data[$field])) {
        $member->set($field, $data[$field]);
      }
    }

    // Handle position taxonomy reference.
    if (isset($data['position'])) {
      $tid = $this->resolveTaxonomyReferences($data['position'], 'position_of_member');
      $member->set('position', $tid);
    }

    // Boolean field.
    if (isset($data['person_with_disability'])) {
      $member->set('person_with_disability', (bool) $data['person_with_disability']);
    }

    // File fields.
    if (isset($data['photo_member_id'])) {
      $fileId = $this->processFileField($data['photo_member_id'], $member->getApplication()->getApplicationId());
      if ($fileId) {
        $member->set('photo_member_id', $fileId);
      }
    }

    if (isset($data['certificate_disability'])) {
      $fileId = $this->processFileField($data['certificate_disability'], $member->getApplication()->getApplicationId());
      if ($fileId) {
        $member->set('certificate_disability', $fileId);
      }
    }

    $member->save();
  }

}
