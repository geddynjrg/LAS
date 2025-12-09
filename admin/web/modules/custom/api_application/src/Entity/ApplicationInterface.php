<?php

namespace Drupal\api_application\Entity;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\EntityChangedInterface;
use Drupal\user\EntityOwnerInterface;

/**
 * Provides an interface for defining Application entities.
 *
 * @ingroup api_application
 */
interface ApplicationInterface extends ContentEntityInterface, EntityChangedInterface, EntityOwnerInterface {

  /**
   * Gets the Application creation timestamp.
   *
   * @return int
   *   Creation timestamp of the Application.
   */
  public function getCreatedTime();

  /**
   * Sets the Application creation timestamp.
   *
   * @param int $timestamp
   *   The Application creation timestamp.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function setCreatedTime($timestamp);

  /**
   * Gets the application status.
   *
   * @return string
   *   The application status.
   */
  public function getStatus();

  /**
   * Sets the application status.
   *
   * @param string $status
   *   The application status.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function setStatus($status);

  /**
   * Gets the application ID.
   *
   * @return string
   *   The application ID.
   */
  public function getApplicationId();

  /**
   * Sets the application ID.
   *
   * @param string $application_id
   *   The application ID.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function setApplicationId($application_id);

  /**
   * Gets the group name.
   *
   * @return string
   *   The group name.
   */
  public function getGroupName();

  /**
   * Sets the group name.
   *
   * @param string $name
   *   The group name.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function setGroupName($name);

  /**
   * Gets the group registration number.
   *
   * @return string
   *   The group registration number.
   */
  public function getGroupRegistrationNumber();

  /**
   * Sets the group registration number.
   *
   * @param string $number
   *   The group registration number.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function setGroupRegistrationNumber($number);

  /**
   * Gets the loan amount.
   *
   * @return int
   *   The loan amount.
   */
  public function getLoanAmount();

  /**
   * Sets the loan amount.
   *
   * @param int $amount
   *   The loan amount.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function setLoanAmount($amount);

  /**
   * Gets the proposed repayment period.
   *
   * @return int
   *   The proposed repayment period in months.
   */
  public function getProposedRepaymentPeriod();

  /**
   * Sets the proposed repayment period.
   *
   * @param int $period
   *   The proposed repayment period in months.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function setProposedRepaymentPeriod($period);

  /**
   * Gets the nature of business.
   *
   * @return string
   *   The nature of business (startup or expansion).
   */
  public function getNatureOfBusiness();

  /**
   * Sets the nature of business.
   *
   * @param string $nature
   *   The nature of business.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function setNatureOfBusiness($nature);

  /**
   * Gets the group members.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface[]
   *   Array of group member entities.
   */
  public function getGroupMembers();

  /**
   * Adds a group member.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The group member to add.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function addGroupMember(GroupMemberInterface $member);

  /**
   * Removes a group member.
   *
   * @param \Drupal\api_application\Entity\GroupMemberInterface $member
   *   The group member to remove.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function removeGroupMember(GroupMemberInterface $member);

  /**
   * Gets the table banking fields visibility status.
   *
   * @return bool
   *   TRUE if table banking is selected, FALSE otherwise.
   */
  public function hasTableBanking();

  /**
   * Sets the table banking fields visibility status.
   *
   * @param bool $value
   *   TRUE to show table banking fields, FALSE to hide them.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The called Application entity.
   */
  public function setTableBanking($value);

  /**
   * Send SMS confirmation to all group members.
   *
   * @param string $trigger
   *   The trigger context for logging (e.g., 'manual', 'new_application',
   *   'status_submitted').
   *
   * @return array|false
   *   The SMS sending results array, or FALSE on failure.
   */
  public function sendSmsConfirmation($trigger = 'manual');

}
