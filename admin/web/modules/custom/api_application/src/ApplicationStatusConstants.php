<?php

namespace Drupal\api_application;

/**
 * Defines constants for application status values.
 *
 * This is the single source of truth for all application statuses.
 * Any changes to statuses should be made here only.
 */
class ApplicationStatusConstants {

  /**
   * Draft status - Application is being filled out.
   */
  const DRAFT = 'draft';

  /**
   * Group member confirmation - Waiting for group members to confirm via SMS.
   */
  const GROUP_MEMBER_CONFIRMATION = 'group_member_confirmation';

  /**
   * Submitted status - Application has been submitted for review.
   */
  const SUBMITTED = 'submitted';

  /**
   * Constituency review - Application is being reviewed at constituency level.
   */
  const CONSTITUENCY_REVIEW = 'constituency_review';

  /**
   * Approved by constituency.
   *
   * Application has been approved at constituency level.
   */
  const APPROVED_BY_CONSTITUENCY = 'approved_by_constituency';

  /**
   * Under review status - Application is under formal review.
   */
  const UNDER_REVIEW = 'under_review';

  /**
   * Approved status - Application has been approved.
   */
  const APPROVED = 'approved';

  /**
   * Rejected status - Application has been rejected.
   */
  const REJECTED = 'rejected';

  /**
   * Disbursed status - Loan has been disbursed.
   */
  const DISBURSED = 'disbursed';

  /**
   * Closed status - Application is closed.
   */
  const CLOSED = 'closed';

  /**
   * Get all valid status values as an array.
   *
   * @return array
   *   Array of all status values.
   */
  public static function getAll(): array {
    return [
      self::DRAFT,
      self::GROUP_MEMBER_CONFIRMATION,
      self::SUBMITTED,
      self::CONSTITUENCY_REVIEW,
      self::APPROVED_BY_CONSTITUENCY,
      self::UNDER_REVIEW,
      self::APPROVED,
      self::REJECTED,
      self::DISBURSED,
      self::CLOSED,
    ];
  }

  /**
   * Get status labels for entity field allowed_values.
   *
   * @return array
   *   Associative array of status values and their translatable labels.
   */
  public static function getAllowedValues(): array {
    return [
      self::DRAFT => t('Draft'),
      self::GROUP_MEMBER_CONFIRMATION => t('Group member confirmation'),
      self::SUBMITTED => t('Submitted'),
      self::CONSTITUENCY_REVIEW => t('Constituency review'),
      self::APPROVED_BY_CONSTITUENCY => t('Approved by constituency'),
      self::UNDER_REVIEW => t('Under Review'),
      self::APPROVED => t('Approved'),
      self::REJECTED => t('Rejected'),
      self::DISBURSED => t('Disbursed'),
      self::CLOSED => t('Closed'),
    ];
  }

}
