<?php

namespace Drupal\api_application\Entity;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\EntityChangedInterface;

/**
 * Provides an interface for defining Group Member entities.
 *
 * @ingroup api_application
 */
interface GroupMemberInterface extends ContentEntityInterface, EntityChangedInterface {

  /**
   * Gets the name.
   *
   * @return string
   *   The member name.
   */
  public function getName();

  /**
   * Sets the name.
   *
   * @param string $name
   *   The member name.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setName($name);

  /**
   * Gets the ID number.
   *
   * @return string
   *   The ID number.
   */
  public function getIdNumber();

  /**
   * Sets the ID number.
   *
   * @param string $id
   *   The ID number.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setIdNumber($id);

  /**
   * Gets the gender.
   *
   * @return string
   *   The gender (male, female, other).
   */
  public function getGender();

  /**
   * Sets the gender.
   *
   * @param string $gender
   *   The gender.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setGender($gender);

  /**
   * Gets the phone number.
   *
   * @return string
   *   The phone number.
   */
  public function getPhoneNumber();

  /**
   * Sets the phone number.
   *
   * @param string $phone
   *   The phone number.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setPhoneNumber($phone);

  /**
   * Gets the position.
   *
   * @return \Drupal\taxonomy\TermInterface|null
   *   The position taxonomy term or NULL.
   */
  public function getPosition();

  /**
   * Sets the position.
   *
   * @param \Drupal\taxonomy\TermInterface|int|null $position
   *   The position taxonomy term, term ID, or NULL.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setPosition($position);

  /**
   * Checks if the member is a person with disability.
   *
   * @return bool
   *   TRUE if the member is a person with disability.
   */
  public function isPersonWithDisability();

  /**
   * Sets the person with disability status.
   *
   * @param bool $value
   *   TRUE if the member is a person with disability.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setPersonWithDisability($value);

  /**
   * Gets the PWD number.
   *
   * @return string|null
   *   The PWD number or NULL if not applicable.
   */
  public function getPwdNumber();

  /**
   * Sets the PWD number.
   *
   * @param string $number
   *   The PWD number.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setPwdNumber($number);

  /**
   * Gets the application this member belongs to.
   *
   * @return \Drupal\api_application\Entity\ApplicationInterface
   *   The application entity.
   */
  public function getApplication();

  /**
   * Sets the application this member belongs to.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setApplication(ApplicationInterface $application);

  /**
   * Gets the confirmation status.
   *
   * @return string
   *   The confirmation status (pending, sent, confirmed, failed).
   */
  public function getConfirmationStatus();

  /**
   * Sets the confirmation status.
   *
   * @param string $status
   *   The confirmation status.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setConfirmationStatus($status);

  /**
   * Gets the confirmation token.
   *
   * @return string|null
   *   The confirmation token or NULL if not set.
   */
  public function getConfirmationToken();

  /**
   * Sets the confirmation token.
   *
   * @param string $token
   *   The confirmation token.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setConfirmationToken($token);

  /**
   * Gets the timestamp when confirmation SMS was sent.
   *
   * @return int|null
   *   The timestamp or NULL if not sent.
   */
  public function getConfirmationSentAt();

  /**
   * Sets the timestamp when confirmation SMS was sent.
   *
   * @param int $timestamp
   *   The timestamp.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setConfirmationSentAt($timestamp);

  /**
   * Gets the timestamp when member confirmed.
   *
   * @return int|null
   *   The timestamp or NULL if not confirmed.
   */
  public function getConfirmationConfirmedAt();

  /**
   * Sets the timestamp when member confirmed.
   *
   * @param int $timestamp
   *   The timestamp.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setConfirmationConfirmedAt($timestamp);

  /**
   * Checks if the member is confirmed.
   *
   * @return bool
   *   TRUE if the member is confirmed.
   */
  public function isConfirmed();

  /**
   * Generates a new confirmation token.
   *
   * @return string
   *   The generated token.
   */
  public function generateConfirmationToken();

  /**
   * Checks if the member requires confirmation.
   *
   * @return bool
   *   TRUE if the member requires confirmation.
   */
  public function requiresConfirmation();

  /**
   * Sets whether the member requires confirmation.
   *
   * @param bool $value
   *   TRUE if the member requires confirmation.
   *
   * @return \Drupal\api_application\Entity\GroupMemberInterface
   *   The called Group Member entity.
   */
  public function setRequiresConfirmation($value);

}
