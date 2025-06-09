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
   * @return string
   *   The position in the group.
   */
  public function getPosition();

  /**
   * Sets the position.
   *
   * @param string $position
   *   The position in the group.
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

}
