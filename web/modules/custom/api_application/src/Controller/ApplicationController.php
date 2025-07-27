<?php

namespace Drupal\api_application\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Messenger\MessengerTrait;
use Drupal\Core\Logger\LoggerChannelTrait;
use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\api_application\Entity\ApplicationInterface;
use Drupal\api_application\Entity\GroupMemberInterface;
use Drupal\api_application\Service\SmsConfirmationService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Returns responses for Application routes.
 */
class ApplicationController extends ControllerBase {

  use MessengerTrait;
  use LoggerChannelTrait;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The date formatter.
   *
   * @var \Drupal\Core\Datetime\DateFormatterInterface
   */
  protected $dateFormatter;

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
   * Constructs a new ApplicationController object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Datetime\DateFormatterInterface $date_formatter
   *   The date formatter.
   * @param \Drupal\Core\Session\AccountProxyInterface $current_user
   *   The current user.
   * @param \Drupal\api_application\Service\SmsConfirmationService $sms_confirmation_service
   *   The SMS confirmation service.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager, DateFormatterInterface $date_formatter, AccountProxyInterface $current_user, SmsConfirmationService $sms_confirmation_service) {
    $this->entityTypeManager = $entity_type_manager;
    $this->dateFormatter = $date_formatter;
    $this->currentUser = $current_user;
    $this->smsConfirmationService = $sms_confirmation_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('date.formatter'),
      $container->get('current_user'),
      $container->get('api_application.sms_confirmation')
    );
  }

  /**
   * Update application status via AJAX.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The current request.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   A JSON response.
   */
  public function updateStatus(ApplicationInterface $application, Request $request) {
    $response = ['success' => FALSE];

    // Get the new status from the request.
    $new_status = $request->request->get('status');
    $rejection_reason = $request->request->get('rejection_reason');
    $rejection_message = $request->request->get('rejection_message');

    if (empty($new_status)) {
      $response['message'] = $this->t('Status is required.');
      return new JsonResponse($response, 400);
    }

    // Validate status transitions.
    $current_status = $application->get('status')->value;
    $allowed_transitions = [
      'draft' => ['submitted'],
      'submitted' => ['under_review', 'rejected'],
      'under_review' => ['approved', 'rejected'],
      'approved' => ['disbursed'],
      'rejected' => ['under_review'],
      'disbursed' => ['under_review', 'closed'],
      'closed' => [],
    ];

    if (!in_array($new_status, $allowed_transitions[$current_status] ?? [])) {
      $response['message'] = $this->t('Invalid status transition from @current to @new.', [
        '@current' => $current_status,
        '@new' => $new_status,
      ]);
      return new JsonResponse($response, 400);
    }

    // If rejecting, validate rejection fields.
    if ($new_status === 'rejected') {
      if (empty($rejection_reason)) {
        $response['message'] = $this->t('Rejection reason is required.');
        return new JsonResponse($response, 400);
      }
      if (empty($rejection_message)) {
        $response['message'] = $this->t('Rejection message is required.');
        return new JsonResponse($response, 400);
      }

      $application->set('rejection_reason', $rejection_reason);
      $application->set('rejection_message', $rejection_message);
    }

    // Update the status.
    $application->set('status', $new_status);
    $application->save();

    $response['success'] = TRUE;
    $response['message'] = $this->t('Application status updated to @status.', [
      '@status' => $new_status,
    ]);

    // Log the action.
    $this->getLogger('api_application')->notice('Application @id status changed from @old to @new by user @user.', [
      '@id' => $application->getApplicationId(),
      '@old' => $current_status,
      '@new' => $new_status,
      '@user' => $this->currentUser()->getAccountName(),
    ]);

    return new JsonResponse($response);
  }

  /**
   * Show response options for a group member via SMS token.
   *
   * @param string $token
   *   The confirmation token.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response.
   */
  public function showMemberResponsePage($token) {
    // Find member by token to validate it.
    $storage = $this->entityTypeManager->getStorage('group_member');
    $query = $storage->getQuery()
      ->accessCheck(FALSE)
      ->condition('confirmation_token', $token)
      ->range(0, 1);

    $ids = $query->execute();

    if (empty($ids)) {
      return new Response(
        '<html><body><h1>Invalid Confirmation Link</h1><p>This confirmation link is invalid or has expired.</p></body></html>',
        404,
        ['Content-Type' => 'text/html']
      );
    }

    $member = $storage->load(reset($ids));
    $application = $member->getApplication();
    $application_name = $application ? $application->getGroupName() : 'Unknown Application';

    // Check if already processed.
    $status = $member->getConfirmationStatus();
    if (in_array($status, ['confirmed', 'declined'])) {
      $icon = $status === 'confirmed' ? '✓' : '✗';
      $color = $status === 'confirmed' ? '#00a651' : '#d32f2f';
      $title = $status === 'confirmed' ? 'Membership Confirmed!' : 'Membership Declined';
      $message = $status === 'confirmed'
        ? 'You have already confirmed your participation in this loan application.'
        : 'You have declined your participation in this loan application.';

      $html = '
      <html>
      <head>
        <title>' . $title . '</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .icon { font-size: 48px; text-align: center; margin-bottom: 20px; color: ' . $color . '; }
          h1 { color: ' . $color . '; text-align: center; }
          p { color: #666; line-height: 1.6; }
          .highlight { color: ' . $color . '; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">' . $icon . '</div>
          <h1>' . $title . '</h1>
          <p>Hello <span class="highlight">' . htmlspecialchars($member->getName()) . '</span>,</p>
          <p>' . $message . '</p>
          <p style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
            Processed on ' . date('F j, Y \a\t g:i A', $member->getConfirmationConfirmedAt()) . '
          </p>
        </div>
      </body>
      </html>';

      return new Response($html, 200, ['Content-Type' => 'text/html']);
    }

    // Show response options.
    $confirm_url = $this->url('api_application.process_member_response', [
      'token' => $token,
    ], [
      'query' => ['action' => 'confirmed'],
      'absolute' => TRUE,
    ]);
    $decline_url = $this->url('api_application.process_member_response', [
      'token' => $token,
    ], [
      'query' => ['action' => 'declined'],
      'absolute' => TRUE,
    ]);

    $html = '
    <html>
    <head>
      <title>Loan Application Membership</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .icon { font-size: 48px; text-align: center; margin-bottom: 20px; color: #333; }
        h1 { color: #333; text-align: center; }
        p { color: #666; line-height: 1.6; text-align: center; }
        .highlight { color: #00a651; font-weight: bold; }
        .buttons { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; padding: 15px 30px; margin: 10px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; transition: all 0.3s; }
        .btn-confirm { background: #00a651; color: white; }
        .btn-confirm:hover { background: #00843d; }
        .btn-decline { background: #d32f2f; color: white; }
        .btn-decline:hover { background: #b71c1c; }
        .details { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❓</div>
        <h1>Loan Application Membership</h1>
        <p>Hello <span class="highlight">' . htmlspecialchars($member->getName()) . '</span>,</p>
        <p>You have been invited to participate in a loan application for:</p>
        <div class="details">
          <p><strong>' . htmlspecialchars($application_name) . '</strong></p>
        </div>
        <p>Please choose your response:</p>
        <div class="buttons">
          <a href="' . $confirm_url . '" class="btn btn-confirm">✓ ACCEPT PARTICIPATION</a>
          <a href="' . $decline_url . '" class="btn btn-decline">✗ DECLINE PARTICIPATION</a>
        </div>
        <p style="color: #999; font-size: 14px;">
          This link will expire after use. Please make your choice now.
        </p>
      </div>
    </body>
    </html>';

    return new Response($html, 200, ['Content-Type' => 'text/html']);
  }

  /**
   * Process member response (confirm or decline) via query parameter.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   * @param string $token
   *   The confirmation token.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response.
   */
  public function processMemberResponse(Request $request, $token) {
    $action = $request->query->get('action', 'confirmed');

    // Validate action.
    if (!in_array($action, ['confirmed', 'declined'])) {
      return new Response(
        '<html><body><h1>Invalid Action</h1><p>Invalid action specified.</p></body></html>',
        400,
        ['Content-Type' => 'text/html']
      );
    }

    return $this->processTokenAction($token, $action);
  }

  /**
   * Process member response action.
   *
   * @param string $token
   *   The confirmation token.
   * @param string $action
   *   The action: 'confirmed' or 'declined'.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response.
   */
  protected function processTokenAction($token, $action) {
    if ($action === 'confirmed') {
      $member = $this->smsConfirmationService->confirmMember($token);
    }
    else {
      $member = $this->smsConfirmationService->declineMember($token);
    }

    if (!$member) {
      return new Response(
        '<html><body><h1>Invalid Confirmation Link</h1><p>This confirmation link is invalid or has expired.</p></body></html>',
        404,
        ['Content-Type' => 'text/html']
      );
    }

    $application = $member->getApplication();
    $application_name = $application ? $application->getGroupName() : 'Unknown Application';

    $icon = $action === 'confirmed' ? '✓' : '✗';
    $color = $action === 'confirmed' ? '#00a651' : '#d32f2f';
    $title = $action === 'confirmed' ? 'Membership Confirmed!' : 'Membership Declined';
    $message = $action === 'confirmed'
      ? 'Your participation in the loan application has been confirmed.'
      : 'You have declined to participate in the loan application.';
    $thanks = $action === 'confirmed'
      ? 'Thank you for confirming your participation. You will be notified of any updates regarding the loan application.'
      : 'Thank you for your response. Your decision has been recorded.';

    $html = '
    <html>
    <head>
      <title>' . $title . '</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .icon { font-size: 48px; text-align: center; margin-bottom: 20px; color: ' . $color . '; }
        h1 { color: ' . $color . '; text-align: center; }
        p { color: #666; line-height: 1.6; }
        .highlight { color: ' . $color . '; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">' . $icon . '</div>
        <h1>' . $title . '</h1>
        <p>Hello <span class="highlight">' . htmlspecialchars($member->getName()) . '</span>,</p>
        <p>' . $message . '</p>
        <p>Application: <span class="highlight">' . htmlspecialchars($application_name) . '</span></p>
        <p>' . $thanks . '</p>
        <p style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          Processed on ' . date('F j, Y \a\t g:i A') . '
        </p>
      </div>
    </body>
    </html>';

    return new Response($html, 200, ['Content-Type' => 'text/html']);
  }

  /**
   * Process member confirmation from URL with action parameter.
   *
   * @param string $token
   *   The confirmation token.
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The current request.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response.
   */
  public function processMemberConfirmation($token, Request $request) {
    $action = $request->query->get('action', 'confirmed');

    // Validate action.
    if (!in_array($action, ['confirmed', 'declined'])) {
      $action = 'confirmed';
    }

    return $this->processMemberResponse($token, $action);
  }

  /**
   * Send confirmation SMS to all members of an application.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The current request.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   A JSON response.
   */
  public function sendConfirmationSms(ApplicationInterface $application, Request $request) {
    $response = ['success' => FALSE];

    try {
      $results = $application->sendSmsConfirmation('manual_admin');

      if ($results !== FALSE) {
        $response['success'] = TRUE;
        $response['message'] = $this->t('SMS sent: @success successful, @failed failed', [
          '@success' => $results['success'],
          '@failed' => $results['failed'],
        ]);
        $response['results'] = $results;

        // Log the action.
        $this->getLogger('api_application')->notice('Confirmation SMS sent to all members of application @id by user @user. Success: @success, Failed: @failed', [
          '@id' => $application->getApplicationId(),
          '@user' => $this->currentUser()->getAccountName(),
          '@success' => $results['success'],
          '@failed' => $results['failed'],
        ]);
      }
      else {
        $response['message'] = $this->t('Failed to send SMS - check logs for details');
      }

    }
    catch (\Exception $e) {
      $response['message'] = $this->t('Error sending SMS: @message', [
        '@message' => $e->getMessage(),
      ]);

      $this->getLogger('api_application')->error('Error sending confirmation SMS for application @id: @message', [
        '@id' => $application->getApplicationId(),
        '@message' => $e->getMessage(),
      ]);
    }

    return new JsonResponse($response);
  }

  /**
   * Send confirmation SMS to a single member.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $group_member
   *   The group member entity.
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The current request.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   A JSON response.
   */
  public function sendMemberConfirmationSms(GroupMemberInterface $group_member, Request $request) {
    $response = ['success' => FALSE];

    try {
      $result = $this->smsConfirmationService->sendConfirmationSms($group_member);

      if ($result) {
        $response['success'] = TRUE;
        $response['message'] = $this->t('Confirmation SMS sent to @name', [
          '@name' => $group_member->getName(),
        ]);

        // Log the action.
        $this->getLogger('api_application')->notice('Confirmation SMS sent to member @name (@id) by user @user', [
          '@name' => $group_member->getName(),
          '@id' => $group_member->id(),
          '@user' => $this->currentUser()->getAccountName(),
        ]);
      }
      else {
        $response['message'] = $this->t('Failed to send SMS to @name', [
          '@name' => $group_member->getName(),
        ]);
      }

    }
    catch (\Exception $e) {
      $response['message'] = $this->t('Error sending SMS: @message', [
        '@message' => $e->getMessage(),
      ]);

      $this->getLogger('api_application')->error('Error sending confirmation SMS to member @name: @message', [
        '@name' => $group_member->getName(),
        '@message' => $e->getMessage(),
      ]);
    }

    return new JsonResponse($response);
  }

}
