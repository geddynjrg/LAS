<?php

namespace Drupal\api_application;

/**
 * Normalizes LMS rejection reason codes for Drupal list_string fields.
 */
class ApplicationRejectionReasons {

  /**
   * Allowed rejection reason machine names on the application entity.
   */
  public static function getAllowedKeys(): array {
    return [
      'incomplete_information',
      'missing_documents',
      'eligibility_criteria',
      'duplicate_application',
      'insufficient_collateral',
      'poor_credit_history',
      'member_declined',
      'other',
    ];
  }

  /**
   * Map LMS/legacy values to a valid Drupal rejection reason key.
   */
  public static function normalize(?string $reason): string {
    if ($reason === NULL || $reason === '') {
      return 'other';
    }

    $reason = strtolower(trim($reason));
    $aliases = [
      'unspecified' => 'other',
      'other_reason' => 'other',
      'incomplete' => 'incomplete_information',
      'missing_document' => 'missing_documents',
      'eligibility' => 'eligibility_criteria',
      'duplicate' => 'duplicate_application',
      'defaulter' => 'poor_credit_history',
      'credit_history' => 'poor_credit_history',
    ];

    if (isset($aliases[$reason])) {
      $reason = $aliases[$reason];
    }

    if (in_array($reason, self::getAllowedKeys(), TRUE)) {
      return $reason;
    }

    return 'other';
  }

}
