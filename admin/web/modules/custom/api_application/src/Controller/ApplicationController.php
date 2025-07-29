<?php

namespace Drupal\api_application\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Messenger\MessengerTrait;
use Drupal\Core\Logger\LoggerChannelTrait;
use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Drupal\api_application\Entity\ApplicationInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

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
   * Constructs a new ApplicationController object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Datetime\DateFormatterInterface $date_formatter
   *   The date formatter.
   * @param \Drupal\Core\Session\AccountProxyInterface $current_user
   *   The current user.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager, DateFormatterInterface $date_formatter, AccountProxyInterface $current_user) {
    $this->entityTypeManager = $entity_type_manager;
    $this->dateFormatter = $date_formatter;
    $this->currentUser = $current_user;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('date.formatter'),
      $container->get('current_user')
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

}
