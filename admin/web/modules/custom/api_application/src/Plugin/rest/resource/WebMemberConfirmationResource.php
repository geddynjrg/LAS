<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\api_application\Service\WebSmsConfirmationService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Component\Utility\Xss;

/**
 * Provides Member Confirmation Resource for Web Database.
 *
 * @RestResource(
 *   id = "web_member_confirmation",
 *   label = @Translation("Web Member Confirmation"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/member/confirm/{token}",
 *     "create" = "/api/v1/member/confirm/{token}/action"
 *   }
 * )
*/

class WebMemberConfirmationResource extends ResourceBase {

  /**
   * The Web SMS confirmation service.
   *
   * @var \Drupal\api_application\Service\WebSmsConfirmationService
   */
  protected $webSmsConfirmationService;

  /**
   * Constructs a new WebMemberConfirmationResource.
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
   * Responds to GET requests.
   *
   * Validates a confirmation token and returns member data from web database.
   */
  public function get(Request $request, $token = NULL) {
    \Drupal::logger('api_application')->info('Web Member Confirmation: Validating token: @token', ['@token' => $token]);

    if (empty($token)) {
      return new ResourceResponse([
        "success" => FALSE,
        "error" => [
          'message' => 'Token parameter is required',
          'code' => 400,
        ],
        "timestamp" => \Drupal::time()->getCurrentTime(),
      ], 400);
    }

    // Sanitize the token.
    $token = Xss::filter($token);

    // Validate token format (should be 64 character hex string from your SMS service)
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
      return new ResourceResponse([
        'success' => FALSE,
          'error' => [
            'message' => 'Invalid token format',
            'code' => 400,
          ],
        'timestamp' => \Drupal::time()->getCurrentTime(),
      ], 400);
    }




    try {
      $action_message = null;
      $db = $this->getWebDatabase();

      // Find member by token in web database
      $member = $db->select('member_data', 'm')
        ->fields('m', [
          'id',
          'fullname',
          'phoneNumber',
          'status',
          'confirmation_status',
          'confirmation_sent_at',
          'confirmation_confirmed_at',
          'confirmation_token_expires_at',
          'applicationId'
        ])
        ->condition('confirmation_token', $token)
        ->range(0, 1)
        ->execute()
        ->fetchAssoc();

      if (!$member) {
        \Drupal::logger('api_application')->warning('Web Member Confirmation: Invalid token: @token', ['@token' => $token]);
        return new ResourceResponse([
          "success" => false,
          "error" => [
            "message" => "Invalid or expired confirmation token",
            "code" => 404,
          ],
          "timestamp" => time(),
        ], 404);
      }

      // Check if token is expired
      if (!empty($member['confirmation_token_expires_at']) &&
          $member['confirmation_token_expires_at'] < date('Y-m-d H:i:s')) {
        \Drupal::logger('api_application')->warning('Web Member Confirmation: Expired token: @token', ['@token' => $token]);
        return new ResourceResponse([
          "success" => false,
          "error" => [
            "message" => "Invalid or expired confirmation token",
            "code" => 410,
          ],
          "timestamp" => time(),
        ], 410);
      }

      // check if the member has already confirmed or declined
      if (in_array($member['status'], ['CONFIRMED'])) {
        if ($member['confirmation_status'] === 'confirmed') {
          $action_message = $this->t('Membership confirmed successfully');
        }
        elseif ($member['confirmation_status'] === 'declined') {
          $action_message = $this->t('Membership declined successfully');
        }
      }

      // Get application information from web database
      $application = $db->select('applications', 'a')
        ->fields('a', ['id', 'applicationId'])
        ->condition('id', $member['applicationId'])
        ->range(0, 1)
        ->execute()
        ->fetchAssoc();

      // Get group name from group_data table
      $groupData = $db->select('group_data', 'g')
        ->fields('g', ['groupName'])
        ->condition('applicationId', $member['applicationId'])
        ->range(0, 1)
        ->execute()
        ->fetchAssoc();

      // Get Loan amount
      $loanData = $db->select('loan_conditions', 'l')
        ->fields('l', ['loanAmount'])
        ->condition('applicationId', $member['applicationId'])
        ->range(0, 1)
        ->execute()
        ->fetchAssoc();

      if (in_array($member['status'], ['PENDING'])) {
        // //LOG MEMBER NOT CONFIRMNED YET
        \Drupal::logger('api_application')->info('Web Member Confirmation: Token valid for member: @name, status: @status', [
          '@name' => $member['fullname'],
          '@status' => $member['confirmation_status'],
        ]);

        $responseData = [
          "success" => true,
          "data" => [
            "member" => [
              "id" => $member['id'],
              "name" => $member['fullname'],
              "phone_number" => $member['phoneNumber'],
              "confirmation_status" => $member['confirmation_status'],
              "confirmation_confirmed_at" => $member['confirmation_confirmed_at']
                ? strtotime($member['confirmation_confirmed_at'])
                : null,
            ],
            "application" => $application ? [
              "application_id" => $application['applicationId'],
              "group_name" => $groupData['groupName'] ?? null,
              "loan_amount" => $loanData['loanAmount'] ? (float) $loanData['loanAmount'] : null,
            ] : null,
          ],
        ];

      }else {
        // action is confirmed or declined, so include it in response, implode form array member confrimation_status
        $action = null;
        if (in_array($member['confirmation_status'], ['confirmed', 'declined'])) {
          $action = $member['confirmation_status'];
        }

        //LOG MEMBER CONFIRMNED ALREADY
        \Drupal::logger('api_application')->info('Web Member Confirmation: Member already confirmed or declined: @name, status: @status', [
          '@name' => $member['fullname'],
          '@status' => $member['confirmation_status'],
        ]);

        $responseData = [
          'success' => TRUE,
          'message' => $action_message,
          'data' => [
            'member' => [
              "id" => $member['id'],
              "name" => $member['fullname'],
              "phone_number" => $member['phoneNumber'],
              "confirmation_status" => $member['confirmation_status'],
              "confirmation_confirmed_at" => $member['confirmation_confirmed_at']
                ? strtotime($member['confirmation_confirmed_at'])
                : null,
            ],
            'application' => [
              'id' => $application['id'] ?? NULL,
              "application_id" => $application['applicationId'],
              "group_name" => $groupData['groupName'] ?? null,
              "loan_amount" => $loanData['loanAmount'] ? (float) $loanData['loanAmount'] : null,
            ],
            'action' => $action, // action is confirmed or declined
            'confirmation_timestamp' => \Drupal::time()->getCurrentTime(),
          ],
        ];
      }

      // Build response data matching your frontend schema


      \Drupal::logger('api_application')->info('Web Member Confirmation: Token validated for member: @name', [
        '@name' => $member['fullname'],
      ]);

      return new ResourceResponse($responseData);

    } catch (\Exception $e) {
      \Drupal::logger('api_application')->error('Web Member Confirmation: Error validating token: @error', ['@error' => $e->getMessage()]);
      return new ResourceResponse([
        'success' => FALSE,
        'error' => [
          'message' => 'An error occurred while processing the response',
          'code' => 500,
        ],
        'timestamp' => \Drupal::time()->getCurrentTime(),
      ], 500);
    }
  }

  /**
   * Responds to POST requests.
   *
   * Processes member confirmation or decline using web database.
   */
  public function post(Request $request, $token = NULL) {
    \Drupal::logger('api_application')->info('Web Member Confirmation: Processing response for token: @token', ['@token' => $token]);

    if (empty($token)) {
      return new ResourceResponse([
        "success" => false,
        "error" => [
          "message" => "Token is required",
          "code" => 400,
        ],
        "timestamp" => time(),
      ], 400);
    }

    // Get request data
    $content = $request->getContent();
    $data = json_decode($content, TRUE) ?: [];

    $action = $data['action'] ?? null;

    //LOG ACTION
    \Drupal::logger('api_application')->info('Web Member Confirmation: Action received: @action for token: @token', [
      '@action' => $action,
      '@token' => $token,
    ]);

    if (!in_array($action, ['confirmed', 'declined'])) {
      return new ResourceResponse([
        'success' => FALSE,
          'error' => [
            'message' => 'Invalid action. Must be "confirmed" or "declined"',
            'code' => 400,
          ],
        'timestamp' => \Drupal::time()->getCurrentTime(),
      ], 400);
    }

    try {
      $member = null;

      if ($action === 'confirmed') {
        $member = $this->webSmsConfirmationService->confirmMember($token);
      }
      else {
        $member = $this->webSmsConfirmationService->declineMember($token);
      }

      if (!$member) {
        return new ResourceResponse([
          "success" => FALSE,
          "error" => [
            "message" => "Invalid or expired token",
            "code" => 404,
          ],
          "timestamp" => time(),
        ], 404);
      }

      // Get updated application information
      $db = $this->getWebDatabase();

      // Get application information from web database
      $application = $db->select('applications', 'a')
        ->fields('a', ['applicationId'])
        ->condition('id', $member['applicationId'])
        ->range(0, 1)
        ->execute()
        ->fetchAssoc();

      // Get group name from group_data table
      $groupData = $db->select('group_data', 'g')
        ->fields('g', ['groupName'])
        ->condition('applicationId', $member['applicationId'])
        ->range(0, 1)
        ->execute()
        ->fetchAssoc();

      // Build response matching your frontend schema
      $responseData = [
        "success" => true,
        "message" => "Confirmation processed successfully",
        "data" => [
          "action" => $action,
          "confirmation_timestamp" => time(),
          "member" => [
            "id" => $member['id'],
            "name" => $member['fullname'],
            "phone_number" => $member['phoneNumber'],
            "confirmation_status" => $member['confirmation_status'],
            "confirmation_confirmed_at" => $member['confirmation_confirmed_at']
              ? strtotime($member['confirmation_confirmed_at'])
              : null,
          ],
          "application" => $application ? [
            "application_id" => $application['applicationId'],
            "group_name" => $groupData['groupName'] ?? null,
          ] : null,
        ],
      ];

      \Drupal::logger('api_application')->info('Web Member Confirmation: Member @name @action participation', [
        '@name' => $member['fullname'],
        '@action' => $action,
      ]);

      return new ResourceResponse($responseData);

    } catch (\Exception $e) {
      \Drupal::logger('api_application')->error('Web Member Confirmation: Error processing response: @error', ['@error' => $e->getMessage()]);
      return new ResourceResponse([
        "success" => false,
        "error" => [
          "message" => "Internal server error",
          "code" => 500,
        ],
        "timestamp" => time(),
      ], 500);
    }
  }

  /**
   * Get Web database connection.
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
