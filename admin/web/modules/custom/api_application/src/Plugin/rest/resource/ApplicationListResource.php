<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\rest_framework\Plugin\rest\resource\RestFrameworkResourceBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Psr\Log\LoggerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;
use Drupal\Core\Session\AccountProxyInterface;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Drupal\api_application\Service\SmsConfirmationService;
use Drupal\file\FileInterface;

/**
 * Provides Application List Resource for GET operations.
 *
 * @RestResource(
 *   id = "application_list",
 *   label = @Translation("API Application List Resource"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/applications"
 *   }
 * )
 */
class ApplicationListResource extends RestFrameworkResourceBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The current user.
   *
   * @var \Drupal\Core\Session\AccountProxyInterface
   */
  protected $currentUser;

  /**
   * The SMS confirmation service.
   *
   * @var \Drupal\api_application\Service\SmsConfirmationService
   */
  protected $smsConfirmationService;

  /**
   * Constructs a new ApplicationListResource object.
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
    AccountProxyInterface $current_user,
    SmsConfirmationService $sms_confirmation_service,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger, $path_matcher, $field_mapper, $language_manager, $alias_manager);
    $this->entityTypeManager = $entity_type_manager;
    $this->currentUser = $current_user;
    $this->smsConfirmationService = $sms_confirmation_service;
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
      $container->get('current_user'),
      $container->get('api_application.sms_confirmation')
    );
  }

  /**
   * Responds to GET requests.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response object.
   */
  public function get(Request $request): Response {
    try {
      // Check if the user is authenticated.
      if (!$this->currentUser->isAuthenticated()) {
        throw new UnauthorizedHttpException('Bearer', 'Authentication required to access this resource.');
      }

      // Load the current user entity.
      $userStorage = $this->entityTypeManager->getStorage('user');
      $user = $userStorage->load($this->currentUser->id());

      if (!$user) {
        $this->logger->error('User entity not found for authenticated user @uid', [
          '@uid' => $this->currentUser->id(),
        ]);
        return $this->createModifiedResponse([
          'error' => 'User not found',
          'message' => 'User entity not found',
        ], 404);
      }

      // Get filtering parameters.
      $status = $request->query->get('status');
      $applicationId = $request->query->get('application_id');
      $limit = $request->query->get('limit', 20);
      $offset = $request->query->get('offset', 0);

      // Validate limit and offset.
      // Between 1 and 100.
      $limit = min(max((int) $limit, 1), 100);
      $offset = max((int) $offset, 0);

      // Load user's applications.
      $applications = $this->loadUserApplications($user->id(), $status, $applicationId, $limit, $offset);
      $totalCount = $this->getUserApplicationsCount($user->id(), $status, $applicationId);

      // Build response data.
      $responseData = [];
      foreach ($applications as $application) {
        $responseData[] = $this->buildApplicationData($application);
      }

      return $this->createModifiedResponse([
        'success' => TRUE,
        'data' => $responseData,
        'meta' => [
          'total_count' => $totalCount,
          'limit' => $limit,
          'offset' => $offset,
          'has_more' => ($offset + $limit) < $totalCount,
        ],
        'user' => [
          'id' => $user->id(),
          'name' => $user->getAccountName(),
          'email' => $user->getEmail(),
        ],
      ]);

    }
    catch (\Exception $e) {
      $this->logger->error('Application list retrieval failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      return $this->createModifiedResponse([
        'error' => 'Internal server error',
        'message' => 'An error occurred while retrieving the applications',
      ], 500);
    }
  }

  /**
   * Loads applications for a user.
   *
   * @param int $userId
   *   The user ID.
   * @param string|null $status
   *   Optional status filter.
   * @param string|null $applicationId
   *   Optional application ID filter.
   * @param int $limit
   *   The limit.
   * @param int $offset
   *   The offset.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface[]
   *   Array of application entities.
   */
  protected function loadUserApplications($userId, $status = NULL, $applicationId = NULL, $limit = 20, $offset = 0) {
    $applicationStorage = $this->entityTypeManager->getStorage('application');

    $query = $applicationStorage->getQuery()
      ->condition('uid', $userId)
      ->sort('created', 'DESC')
      ->range($offset, $limit)
      ->accessCheck(FALSE);

    if (!empty($status)) {
      $query->condition('status', $status);
    }

    if (!empty($applicationId)) {
      $query->condition('application_id', $applicationId);
    }

    $applicationIds = $query->execute();

    if (empty($applicationIds)) {
      return [];
    }

    return $applicationStorage->loadMultiple($applicationIds);
  }

  /**
   * Gets the total count of applications for a user.
   *
   * @param int $userId
   *   The user ID.
   * @param string|null $status
   *   Optional status filter.
   * @param string|null $applicationId
   *   Optional application ID filter.
   *
   * @return int
   *   The total count.
   */
  protected function getUserApplicationsCount($userId, $status = NULL, $applicationId = NULL) {
    $applicationStorage = $this->entityTypeManager->getStorage('application');

    $query = $applicationStorage->getQuery()
      ->condition('uid', $userId)
      ->accessCheck(FALSE)
      ->count();

    if (!empty($status)) {
      $query->condition('status', $status);
    }

    if (!empty($applicationId)) {
      $query->condition('application_id', $applicationId);
    }

    return (int) $query->execute();
  }

  /**
   * Builds the application data array.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return array
   *   The application data.
   */
  protected function buildApplicationData($application) {
    $data = [
      'id' => $application->id(),
      'uuid' => $application->uuid(),
      'application_id' => $application->getApplicationId(),
      'status' => $this->mapStatusForApi($application->getStatus()),
      'created' => $application->getCreatedTime(),
      'changed' => $application->getChangedTime(),
      'owner' => [
        'id' => $application->getOwnerId(),
        'email' => $application->getOwner()->getEmail(),
        'name' => $application->getOwner()->getAccountName(),
      ],
    ];

    // Step 1: Group Data.
    $data['group_data'] = [
      'group_name' => $application->getGroupName(),
      'group_registration_number' => $application->getGroupRegistrationNumber(),
      'date_registered' => $application->get('date_registered')->value,
      'group_registration_certificate' => $this->getFileData($application->get('group_registration_certificate')->entity),
      'list_of_members_certificate' => $this->getFileData($application->get('list_of_members_certificate')->entity),
      'group_background' => $this->getTaxonomyData($application->get('group_background')),
      'key_activities' => $this->transformKeyActivities($this->getTaxonomyData($application->get('key_activities'))),
      'value_chain' => $this->getTaxonomyData($application->get('value_chain')),
      'table_banking_duration' => $application->get('table_banking_duration')->value,
      'monthly_share_contribution' => $application->get('monthly_share_contribution')->value,
      'total_amount_loaned' => $application->get('total_amount_loaned')->value,
      'total_revolving_fund' => $application->get('total_revolving_fund')->value,
      'other_activities' => $application->get('other_activities')->value,
      'group_credit_history' => $this->getMultipleFileData($application->get('group_credit_history')),
    ];

    // Location data.
    $data['location'] = [
      'county' => $this->getTaxonomyData($application->get('county'), TRUE),
      'constituency' => $this->getTaxonomyData($application->get('constituency'), TRUE),
      'ward' => $application->get('ward')->value,
      'meeting_point' => $application->get('meeting_point')->value,
      'nearest_landmark' => $application->get('nearest_landmark')->value,
    ];

    // Step 2: Group Members.
    $data['group_members'] = [];
    foreach ($application->getGroupMembers() as $member) {
      $data['group_members'][] = $this->buildGroupMemberData($member);
    }
    $data['nature_of_group'] = $application->get('nature_of_group')->value;

    // Step 3: Loan Conditions.
    $data['loan_conditions'] = [
      'loan_type' => $this->getTaxonomyData($application->get('loan_type'), TRUE),
      'loan_amount' => $application->getLoanAmount(),
      'proposed_repayment_period' => $application->getProposedRepaymentPeriod(),
      'bank_name' => $this->getTaxonomyData($application->get('bank_name'), TRUE),
      'bank_branch' => $application->get('bank_branch')->value,
      'bank_account_number' => $application->get('bank_account_number')->value,
    ];

    // Step 4: Proposed Business.
    $data['proposed_business'] = [
      'nature_of_business' => $application->getNatureOfBusiness(),
      'business_type' => $this->getTaxonomyData($application->get('business_type')),
      'years_in_operation' => $application->get('years_in_operation')->value,
      'average_income' => $application->get('average_income')->value,
      'expenses' => $this->getMapFieldValues($application->get('expenses')),
    ];

    // Rejection details if applicable.
    if ($application->getStatus() === 'rejected') {
      $data['rejection_details'] = [
        'rejection_reason' => $application->get('rejection_reason')->value,
        'rejection_message' => $application->get('rejection_message')->value,
      ];
    }

    return $data;
  }

  /**
   * Builds group member data.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The group member entity.
   *
   * @return array
   *   The member data.
   */
  protected function buildGroupMemberData($member) {
    $data = [
      'id' => $member->id(),
      'name' => $member->getName(),
      'id_number' => $member->getIdNumber(),
      'gender' => $member->getGender(),
      'phone_number' => $member->getPhoneNumber(),
      'position' => $this->getTaxonomyData($member->get('position'), TRUE),
      'photo_member_id' => $this->getFileData($member->get('photo_member_id')->entity),
      'person_with_disability' => $member->isPersonWithDisability(),
      'requires_confirmation' => $member->requiresConfirmation(),
      'confirmation' => [
        'status' => $member->getConfirmationStatus(),
        'sent_at' => $member->getConfirmationSentAt(),
        'confirmed_at' => $member->getConfirmationConfirmedAt(),
        'is_confirmed' => $member->isConfirmed(),
        'is_declined' => $member->getConfirmationStatus() === 'declined',
        'urls' => [
          'api' => $this->smsConfirmationService->getApiConfirmationUrl($member),
          'frontend' => $this->smsConfirmationService->getFrontendConfirmationUrl($member),
          'sms' => $this->smsConfirmationService->getFrontendConfirmationUrl($member),
        ],
      ],
    ];

    if ($member->isPersonWithDisability()) {
      $data['pwd_number'] = $member->getPwdNumber();
      $data['certificate_disability'] = $this->getFileData($member->get('certificate_disability')->entity);
    }

    return $data;
  }

  /**
   * Gets file data.
   *
   * @param \Drupal\file\FileInterface|null $file
   *   The file entity.
   *
   * @return array|null
   *   The file data or NULL.
   */
  protected function getFileData($file) {
    if (!$file instanceof FileInterface) {
      return NULL;
    }

    return [
      'fid' => $file->id(),
      'uuid' => $file->uuid(),
      'filename' => $file->getFilename(),
      'url' => $file->createFileUrl(FALSE),
      'size' => $file->getSize(),
      'mime_type' => $file->getMimeType(),
    ];
  }

  /**
   * Gets multiple file data.
   *
   * @param \Drupal\Core\Field\FieldItemListInterface $field
   *   The field item list.
   *
   * @return array
   *   The file data array.
   */
  protected function getMultipleFileData($field) {
    $files = [];
    foreach ($field as $item) {
      if ($item->entity) {
        $files[] = $this->getFileData($item->entity);
      }
    }
    return $files;
  }

  /**
   * Gets taxonomy term data.
   *
   * @param \Drupal\Core\Field\FieldItemListInterface $field
   *   The field item list.
   * @param bool $single
   *   Whether to return a single value.
   *
   * @return array|null
   *   The term data.
   */
  protected function getTaxonomyData($field, $single = FALSE) {
    $values = [];

    foreach ($field as $item) {
      if ($item->entity) {
        $term = $item->entity;
        $termData = [
          'tid' => $term->id(),
          'name' => $term->getName(),
          'vocabulary' => $term->bundle(),
        ];

        if ($single) {
          return $termData;
        }

        $values[] = $termData;
      }
    }

    return $single ? NULL : $values;
  }

  /**
   * Transforms key activities term names to API enum values.
   *
   * @param array $taxonomyData
   *   Array of taxonomy term data.
   *
   * @return array
   *   Array with transformed name values.
   */
  protected function transformKeyActivities(array $taxonomyData): array {
    $nameMap = [
      'Value chain' => 'value_chain',
      'Table banking' => 'table_banking',
      'Other' => 'other',
    ];

    return array_map(function ($termData) use ($nameMap) {
      if (isset($termData['name']) && isset($nameMap[$termData['name']])) {
        $termData['name'] = $nameMap[$termData['name']];
      }
      return $termData;
    }, $taxonomyData);
  }

  /**
   * Gets list field values.
   *
   * @param \Drupal\Core\Field\FieldItemListInterface $field
   *   The field item list.
   *
   * @return array
   *   The list values.
   */
  protected function getListValues($field) {
    $values = [];
    foreach ($field as $item) {
      $values[] = $item->value;
    }
    return $values;
  }

  /**
   * Gets map field values.
   *
   * @param \Drupal\Core\Field\FieldItemListInterface $field
   *   The field item list.
   *
   * @return array
   *   The map values.
   */
  protected function getMapFieldValues($field) {
    $values = [];

    // For map fields, we need to reconstruct the key-value pairs.
    $map_data = [];
    foreach ($field as $item) {
      $item_value = $item->getValue();
      // Map field stores key-value pairs.
      if (isset($item_value['key']) && isset($item_value['value'])) {
        $map_data[$item_value['key']] = $item_value['value'];
      }
    }

    // Return as a single map object if there's data.
    if (!empty($map_data)) {
      $values[] = $map_data;
    }

    return $values;
  }

  /**
   * Gets human-readable status label.
   *
   * @param string $status
   *   The status machine name.
   *
   * @return string
   *   The status label.
   */
  protected function getStatusLabel($status) {
    $statuses = [
      'draft' => 'Draft',
      'submitted' => 'Submitted',
      'unassigned' => 'Unassigned',
      'under_review' => 'Under Review',
      'approved' => 'Approved',
      'rejected' => 'Rejected',
      'disbursed' => 'Disbursed',
      'closed' => 'Closed',
    ];

    return $statuses[$status] ?? $status;
  }

  /**
   * Maps internal status to API status.
   *
   * Hides the 'unassigned' status from the API by mapping it to 'submitted'.
   *
   * @param string $status
   *   The internal status.
   *
   * @return string
   *   The status to show in the API.
   */
  protected function mapStatusForApi($status) {
    // Map 'unassigned' to 'submitted' for API responses.
    if ($status === 'unassigned') {
      return 'submitted';
    }
    return $status;
  }

}
