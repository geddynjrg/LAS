<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\Core\Logger\LoggerChannelTrait;
use Drupal\rest_framework\Plugin\rest\resource\RestFrameworkResourceBase;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;
use Drupal\api_application\Service\SmsConfirmationService;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\path_alias\AliasManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Drupal\Component\Utility\Xss;

/**
 * Provides a REST resource for member confirmation via SMS token.
 *
 * @RestResource(
 *   id = "member_response",
 *   label = @Translation("API Member Response"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/member/response/{token}"
 *   }
 * )
 */
class MemberResponseResource extends RestFrameworkResourceBase {

  use LoggerChannelTrait;

  /**
   * The SMS confirmation service.
   *
   * @var \Drupal\api_application\Service\SmsConfirmationService
   */
  protected $smsConfirmationService;

  /**
   * Constructs a new MemberResponseResource object.
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
    SmsConfirmationService $sms_confirmation_service,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger, $path_matcher, $field_mapper, $language_manager, $alias_manager);
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
      $container->get('api_application.sms_confirmation'),
    );
  }

  /**
   * Process member response via SMS token.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   * @param string $token
   *   The confirmation token.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response.
   */
  public function get(Request $request, $token = NULL): Response {
    // Validate token parameter.
    if (empty($token)) {
      return $this->createModifiedResponse([
        'success' => FALSE,
        'error' => [
          'message' => 'Token parameter is required',
          'code' => 400,
        ],
        'timestamp' => \Drupal::time()->getCurrentTime(),
      ], 400);
    }

    // Sanitize the token.
    $token = Xss::filter($token);

    // Validate token format (should be 64 character hex string).
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
      return $this->createModifiedResponse([
        'success' => FALSE,
        'error' => [
          'message' => 'Invalid token format',
          'code' => 400,
        ],
        'timestamp' => \Drupal::time()->getCurrentTime(),
      ], 400);
    }

    // Get action from query parameter.
    $action = $request->query->get('action');

    try {
      // Find member by token to check if valid.
      $storage = $this->smsConfirmationService->getEntityTypeManager()->getStorage('group_member');
      $query = $storage->getQuery()
        ->accessCheck(FALSE)
        ->condition('confirmation_token', $token)
        ->range(0, 1);

      $ids = $query->execute();

      if (empty($ids)) {
        return $this->createModifiedResponse([
          'success' => FALSE,
          'error' => [
            'message' => 'Invalid or expired confirmation token',
            'code' => 404,
          ],
          'timestamp' => \Drupal::time()->getCurrentTime(),
        ], 404);
      }

      $member = $storage->load(reset($ids));
      $application = $member->getApplication();

      // If no action provided, just return member details (info mode).
      if (empty($action)) {
        $response_data = [
          'success' => TRUE,
          'data' => [
            'member' => [
              'id' => $member->id(),
              'name' => $member->getName(),
              'phone_number' => $member->getPhoneNumber(),
              'confirmation_status' => $member->getConfirmationStatus(),
              'confirmation_sent_at' => $member->getConfirmationSentAt(),
              'confirmation_confirmed_at' => $member->getConfirmationConfirmedAt(),
            ],
            'application' => [
              'id' => $application ? $application->id() : NULL,
              'application_id' => $application ? $application->getApplicationId() : NULL,
              'group_name' => $application ? $application->getGroupName() : NULL,
            ],
          ],
        ];

        return $this->createModifiedResponse($response_data);
      }

      // Validate action.
      if (!in_array($action, ['confirmed', 'declined'])) {
        return $this->createModifiedResponse([
          'success' => FALSE,
          'error' => [
            'message' => 'Invalid action. Must be "confirmed" or "declined"',
            'code' => 400,
          ],
          'timestamp' => \Drupal::time()->getCurrentTime(),
        ], 400);
      }

      // Process the member response.
      if ($action === 'confirmed') {
        $member = $this->smsConfirmationService->confirmMember($token);
        $action_message = $this->t('Membership confirmed successfully');
      }
      else {
        $member = $this->smsConfirmationService->declineMember($token);
        $action_message = $this->t('Membership declined successfully');
      }

      if (!$member) {
        return $this->createModifiedResponse([
          'success' => FALSE,
          'error' => [
            'message' => 'Invalid or expired confirmation token',
            'code' => 404,
          ],
          'timestamp' => \Drupal::time()->getCurrentTime(),
        ], 404);
      }

      // Build response data.
      $response_data = [
        'success' => TRUE,
        'message' => $action_message,
        'data' => [
          'member' => [
            'id' => $member->id(),
            'name' => $member->getName(),
            'phone_number' => $member->getPhoneNumber(),
            'confirmation_status' => $member->getConfirmationStatus(),
            'confirmation_confirmed_at' => $member->getConfirmationConfirmedAt(),
          ],
          'application' => [
            'id' => $application ? $application->id() : NULL,
            'application_id' => $application ? $application->getApplicationId() : NULL,
            'group_name' => $application ? $application->getGroupName() : NULL,
          ],
          'action' => $action,
          'confirmation_timestamp' => \Drupal::time()->getCurrentTime(),
        ],
      ];

      $this->getLogger('api_application')->info('Member @name @action participation via REST API token', [
        '@name' => $member->getName(),
        '@action' => $action,
      ]);

      return $this->createModifiedResponse($response_data);

    }
    catch (\Exception $e) {
      $this->getLogger('api_application')->error('Error processing member response via REST API: @message', [
        '@message' => $e->getMessage(),
      ]);

      return $this->createModifiedResponse([
        'success' => FALSE,
        'error' => [
          'message' => 'An error occurred while processing the response',
          'code' => 500,
        ],
        'timestamp' => \Drupal::time()->getCurrentTime(),
      ], 500);
    }
  }

}
