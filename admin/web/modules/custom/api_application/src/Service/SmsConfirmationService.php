<?php

namespace Drupal\api_application\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Url;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Cache\CacheTagsInvalidatorInterface;
use Drupal\Component\Datetime\TimeInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Drupal\sms_providers\Service\SmsServiceInterface;
use Drupal\api_application\Entity\GroupMemberInterface;

/**
 * Service for handling SMS confirmations for group members.
 */
class SmsConfirmationService {

  use StringTranslationTrait;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The SMS service.
   *
   * @var \Drupal\sms_providers\Service\SmsServiceInterface
   */
  protected $smsService;

  /**
   * The logger.
   *
   * @var \Psr\Log\LoggerInterface
   */
  protected $logger;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The cache tags invalidator.
   *
   * @var \Drupal\Core\Cache\CacheTagsInvalidatorInterface
   */
  protected $cacheTagsInvalidator;

  /**
   * The time service.
   *
   * @var \Drupal\Component\Datetime\TimeInterface
   */
  protected $time;

  /**
   * The request stack.
   *
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  protected $requestStack;

  /**
   * Constructs a new SmsConfirmationService.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\sms_providers\Service\SmsServiceInterface $sms_service
   *   The SMS service.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Cache\CacheTagsInvalidatorInterface $cache_tags_invalidator
   *   The cache tags invalidator.
   * @param \Drupal\Component\Datetime\TimeInterface $time
   *   The time service.
   * @param \Symfony\Component\HttpFoundation\RequestStack $request_stack
   *   The request stack.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    SmsServiceInterface $sms_service,
    LoggerChannelFactoryInterface $logger_factory,
    ConfigFactoryInterface $config_factory,
    CacheTagsInvalidatorInterface $cache_tags_invalidator,
    TimeInterface $time,
    RequestStack $request_stack,
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->smsService = $sms_service;
    $this->logger = $logger_factory->get('api_application');
    $this->configFactory = $config_factory;
    $this->cacheTagsInvalidator = $cache_tags_invalidator;
    $this->time = $time;
    $this->requestStack = $request_stack;
  }

  /**
   * Get the entity type manager.
   *
   * @return \Drupal\Core\Entity\EntityTypeManagerInterface
   *   The entity type manager.
   */
  public function getEntityTypeManager() {
    return $this->entityTypeManager;
  }

  /**
   * Send confirmation SMS to a group member.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The group member entity.
   *
   * @return bool
   *   TRUE if SMS was sent successfully, FALSE otherwise.
   */
  public function sendConfirmationSms(GroupMemberInterface $member) {
    // Generate confirmation token if not exists.
    if (!$member->getConfirmationToken()) {
      $member->generateConfirmationToken();
    }

    // Generate confirmation URL (frontend URL, falls back to HTML if not
    // configured).
    $confirmation_url = $this->generateConfirmationUrl($member, 'frontend');

    // Get phone number and validate.
    $phone_number = $member->getPhoneNumber();
    if (empty($phone_number)) {
      $this->logger->error(
          'Cannot send confirmation SMS: No phone number for member @id',
          [
            '@id' => $member->id(),
          ]);
      return FALSE;
    }

    // Prepare SMS message.
    $message = $this->buildConfirmationMessage($member, $confirmation_url);

    try {
      // Send SMS.
      $result = $this->smsService->sendSms($phone_number, $message);

      if ($result['success'] ?? FALSE) {
        // Update member status.
        $member->setConfirmationStatus('sent');
        $member->setConfirmationSentAt($this->time->getCurrentTime());
        $member->save();

        // Invalidate application cache to ensure updated data is visible.
        $this->invalidateApplicationCache($member);

        $this->logger->info(
          'Confirmation SMS sent to member @name (@phone). Message ID: @message_id',
          [
            '@name' => $member->getName(),
            '@phone' => $phone_number,
            '@message_id' => $result['message_id'] ?? 'N/A',
          ]);

        return TRUE;
      }
      else {
        // Mark as failed.
        $member->setConfirmationStatus('failed');
        $member->save();

        // Invalidate application cache to ensure updated data is visible.
        $this->invalidateApplicationCache($member);

        $this->logger->error(
          'Failed to send confirmation SMS to member @name (@phone). Error: @error',
          [
            '@name' => $member->getName(),
            '@phone' => $phone_number,
            '@error' => $result['message'] ?? 'Unknown error',
          ]);

        return FALSE;
      }
    }
    catch (\Exception $e) {
      // Mark as failed.
      $member->setConfirmationStatus('failed');
      $member->save();

      // Invalidate application cache to ensure updated data is visible.
      $this->invalidateApplicationCache($member);

      $this->logger->error(
        'Exception sending confirmation SMS to member @name: @message',
        [
          '@name' => $member->getName(),
          '@message' => $e->getMessage(),
        ]);

      return FALSE;
    }
  }

  /**
   * Send confirmation SMS to all members of an application.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return array
   *   Array with 'success' and 'failed' counts.
   */
  public function sendConfirmationSmsToAllMembers($application) {
    $results = ['success' => 0, 'failed' => 0];

    $members = $application->getGroupMembers();

    foreach ($members as $member) {
      // Only send to members who haven't responded yet (confirmed or declined).
      if (!in_array($member->getConfirmationStatus(), ['confirmed', 'declined'])) {
        if ($this->sendConfirmationSms($member)) {
          $results['success']++;
        }
        else {
          $results['failed']++;
        }
      }
    }

    // Invalidate application cache after batch operation.
    $this->cacheTagsInvalidator->invalidateTags([
      'application:' . $application->id(),
    ]);

    return $results;
  }

  /**
   * Confirm a group member using their token.
   *
   * @param string $token
   *   The confirmation token.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface|null
   *   The confirmed member entity or NULL if token is invalid.
   */
  public function confirmMember($token) {
    return $this->processMemberResponse($token, 'confirmed');
  }

  /**
   * Decline a group member using their token.
   *
   * @param string $token
   *   The confirmation token.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface|null
   *   The declined member entity or NULL if token is invalid.
   */
  public function declineMember($token) {
    return $this->processMemberResponse($token, 'declined');
  }

  /**
   * Process member response (confirm or decline) via confirmation token.
   *
   * @param string $token
   *   The confirmation token.
   * @param string $action
   *   The action: 'confirmed' or 'declined'.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface|null
   *   The updated member entity or NULL if token is invalid.
   */
  protected function processMemberResponse($token, $action) {
    // Validate action.
    if (!in_array($action, ['confirmed', 'declined'])) {
      return NULL;
    }

    if (empty($token)) {
      return NULL;
    }

    // Find member by token.
    $storage = $this->entityTypeManager->getStorage('group_member');
    $query = $storage->getQuery()
      ->accessCheck(FALSE)
      ->condition('confirmation_token', $token)
      ->range(0, 1);

    $ids = $query->execute();

    if (empty($ids)) {
      $this->logger->warning('Invalid confirmation token used: @token', [
        '@token' => $token,
      ]);
      return NULL;
    }

    $member = $storage->load(reset($ids));

    if (!$member) {
      return NULL;
    }

    // Check if already processed.
    if ($member->getConfirmationStatus() === $action) {
      return $member;
    }

    // Update the member status.
    $member->setConfirmationStatus($action);
    $member->setConfirmationConfirmedAt($this->time->getCurrentTime());
    $member->save();

    // Invalidate application cache to ensure updated data is visible.
    $this->invalidateApplicationCache($member);

    $this->logger->info('Member @name @action participation via SMS token', [
      '@name' => $member->getName(),
      '@action' => $action,
    ]);

    // Check if application status should be updated based on member responses.
    $this->checkApplicationStatusAfterMemberResponse($member);

    return $member;
  }

  /**
   * Generate confirmation URL for a member.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The group member entity.
   * @param string $url_type
   *   The type of URL to generate: 'frontend', 'api', or 'html'.
   *
   * @return string
   *   The confirmation URL.
   */
  protected function generateConfirmationUrl(
    GroupMemberInterface $member,
    $url_type = 'frontend',
  ) {
    $token = $member->getConfirmationToken();
    $config = $this->configFactory->get('api_application.settings');

    switch ($url_type) {
      case 'api':
        // Generate REST API endpoint URL.
        $request = $this->requestStack->getCurrentRequest();
        $base_url = $request ? $request->getSchemeAndHttpHost() : '';
        return $base_url . '/api/v1/member/response/' . $token;

      case 'frontend':
        // Generate frontend application URL if configured.
        $frontend_base_url = $config->get('frontend_base_url');
        $frontend_path = $config->get('frontend_confirmation_path') ?: '/confirm/{token}';

        if (!empty($frontend_base_url)) {
          $frontend_url = rtrim($frontend_base_url, '/') . '/' .
            ltrim(str_replace('{token}', $token, $frontend_path), '/');
          return $frontend_url;
        }
        // Fall back to HTML page if no frontend URL configured.
        // fallthrough.
      case 'html':
      default:
        // Generate HTML response page URL.
        $url = Url::fromRoute('api_application.member_response', [
          'token' => $token,
        ], [
          'absolute' => TRUE,
        ]);

        return $url->toString();
    }
  }

  /**
   * Get the REST API confirmation URL for a member.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The group member entity.
   *
   * @return string
   *   The REST API confirmation URL.
   */
  public function getApiConfirmationUrl(GroupMemberInterface $member) {
    if (!$member->getConfirmationToken()) {
      $member->generateConfirmationToken();
      $member->save();
    }

    return $this->generateConfirmationUrl($member, 'api');
  }

  /**
   * Get the frontend confirmation URL for a member.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The group member entity.
   *
   * @return string
   *   The frontend confirmation URL.
   */
  public function getFrontendConfirmationUrl(GroupMemberInterface $member) {
    if (!$member->getConfirmationToken()) {
      $member->generateConfirmationToken();
      $member->save();
    }

    return $this->generateConfirmationUrl($member, 'frontend');
  }

  /**
   * Get the HTML confirmation URL for a member.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The group member entity.
   *
   * @return string
   *   The HTML confirmation URL.
   */
  public function getHtmlConfirmationUrl(GroupMemberInterface $member) {
    if (!$member->getConfirmationToken()) {
      $member->generateConfirmationToken();
      $member->save();
    }

    return $this->generateConfirmationUrl($member, 'html');
  }

  /**
   * Build the confirmation SMS message.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The group member entity.
   * @param string $confirmation_url
   *   The confirmation URL.
   *
   * @return string
   *   The SMS message.
   */
  protected function buildConfirmationMessage(
    GroupMemberInterface $member,
    $confirmation_url,
  ) {
    $config = $this->configFactory->get('api_application.settings');
    $custom_message = $config->get('sms_confirmation_message');

    if (!empty($custom_message)) {
      // Replace tokens in custom message.
      $message = str_replace([
        '[member:name]',
        '[confirmation:url]',
      ], [
        $member->getName(),
        $confirmation_url,
      ], $custom_message);
    }
    else {
      // Default message.
      $message = $this->t('Hello @name, please respond to your loan application membership. You can ACCEPT or DECLINE your participation by clicking: @url', [
        '@name' => $member->getName(),
        '@url' => $confirmation_url,
      ]);
    }

    return $message;
  }

  /**
   * Get confirmation statistics for an application.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return array
   *   Array with confirmation statistics.
   */
  public function getConfirmationStats($application) {
    $stats = [
      'total' => 0,
      'pending' => 0,
      'sent' => 0,
      'confirmed' => 0,
      'declined' => 0,
      'failed' => 0,
    ];

    $members = $application->getGroupMembers();

    // Filter to only count members who require confirmation.
    $members_requiring_confirmation = [];
    foreach ($members as $member) {
      if ($member->requiresConfirmation()) {
        $members_requiring_confirmation[] = $member;
      }
    }

    $stats['total'] = count($members_requiring_confirmation);

    foreach ($members_requiring_confirmation as $member) {
      $status = $member->getConfirmationStatus();
      if (isset($stats[$status])) {
        $stats[$status]++;
      }
    }

    return $stats;
  }

  /**
   * Check if all members have responded (confirmed or declined).
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return bool
   *   TRUE if all members have responded, FALSE otherwise.
   */
  public function areAllMembersConfirmed($application) {
    $members = $application->getGroupMembers();

    foreach ($members as $member) {
      // Only check members who require confirmation.
      if (!$member->requiresConfirmation()) {
        continue;
      }

      $status = $member->getConfirmationStatus();
      if (!in_array($status, ['confirmed', 'declined'])) {
        return FALSE;
      }
    }

    return TRUE;
  }

  /**
   * Invalidate application cache for a member.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The group member entity.
   */
  protected function invalidateApplicationCache($member) {
    $application = $member->getApplication();
    if ($application) {
      $this->cacheTagsInvalidator->invalidateTags([
        'application:' . $application->id(),
      ]);
    }
  }

  /**
   * Check if application status should be updated after a member response.
   *
   * This method checks the confirmation status of all required group members
   * and transitions the application to the appropriate status:
   * - If all required members confirmed: transition to 'unassigned'
   * - If any required member declined: transition to 'rejected'
   * - Otherwise: keep as 'submitted' (waiting for more confirmations)
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The member that just responded.
   */
  protected function checkApplicationStatusAfterMemberResponse(GroupMemberInterface $member) {
    $application = $member->getApplication();

    if (!$application) {
      return;
    }

    // Only check if application is currently submitted.
    if ($application->getStatus() !== 'submitted') {
      return;
    }

    try {
      $group_members = $application->getGroupMembers();
      $required_members = [];
      $declined_members = [];
      $confirmed_count = 0;

      // Filter to only members who require confirmation.
      foreach ($group_members as $group_member) {
        if ($group_member->requiresConfirmation()) {
          $required_members[] = $group_member;
          $status = $group_member->getConfirmationStatus();

          if ($status === 'declined') {
            $declined_members[] = $group_member;
          }
          elseif ($status === 'confirmed') {
            $confirmed_count++;
          }
        }
      }

      // If no members require confirmation, proceed to unassigned.
      if (empty($required_members)) {
        $application->setStatus('unassigned');
        $application->save();
        $this->logger->notice(
          'Application @id transitioned to unassigned (no members require confirmation)',
          ['@id' => $application->getApplicationId()]
        );
        return;
      }

      // If any required member declined, reject the application.
      if (!empty($declined_members)) {
        $member_names = array_map(function ($group_member) {
          return $group_member->getName();
        }, $declined_members);

        $rejection_message = $this->t('Application declined by group member(s): @members', [
          '@members' => implode(', ', $member_names),
        ]);

        $application->setStatus('rejected');
        $application->set('rejection_reason', 'member_declined');
        $application->set('rejection_message', $rejection_message);
        $application->save();

        $this->logger->notice(
          'Application @id transitioned to rejected (declined by: @members)',
          [
            '@id' => $application->getApplicationId(),
            '@members' => implode(', ', $member_names),
          ]
        );
        return;
      }

      // If all required members confirmed, transition to unassigned.
      if ($confirmed_count === count($required_members)) {
        $application->setStatus('unassigned');
        $application->save();

        $this->logger->notice(
          'Application @id transitioned to unassigned (all members confirmed: @count/@total)',
          [
            '@id' => $application->getApplicationId(),
            '@count' => $confirmed_count,
            '@total' => count($required_members),
          ]
        );
        return;
      }

      // Otherwise, keep as submitted (waiting for more confirmations).
      $this->logger->info(
        'Application @id remains submitted (confirmed: @count/@total, waiting for more responses)',
        [
          '@id' => $application->getApplicationId(),
          '@count' => $confirmed_count,
          '@total' => count($required_members),
        ]
      );

    }
    catch (\Exception $e) {
      $this->logger->error(
        'Failed to check application status after member response for application @id: @error',
        [
          '@id' => $application ? $application->getApplicationId() : 'unknown',
          '@error' => $e->getMessage(),
        ]
      );
    }
  }

}
