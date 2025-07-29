<?php

namespace Drupal\api_application;

use Drupal\Core\Entity\EntityAccessControlHandler;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Access\AccessResult;

/**
 * Access controller for the Group Member entity.
 *
 * @see \Drupal\api_application\Entity\GroupMember.
 */
class GroupMemberAccessControlHandler extends EntityAccessControlHandler {

  /**
   * {@inheritdoc}
   */
  protected function checkAccess(EntityInterface $entity, $operation, AccountInterface $account) {
    /** @var \Drupal\api_application\Entity\GroupMemberInterface $entity */

    // Check admin permission first.
    if ($account->hasPermission('administer group members')) {
      return AccessResult::allowed()->cachePerPermissions();
    }

    // Group members are managed through their parent application.
    if ($application = $entity->getApplication()) {
      $application_access = $application->access($operation, $account, TRUE);
      return $application_access;
    }

    // If no application is associated, check based on operation.
    switch ($operation) {
      case 'view':
        return AccessResult::allowedIfHasPermission($account, 'view loan applications')
          ->cachePerPermissions();

      case 'update':
      case 'delete':
        return AccessResult::allowedIfHasPermission($account, 'edit loan applications')
          ->cachePerPermissions();
    }

    // Unknown operation, no opinion.
    return AccessResult::neutral();
  }

  /**
   * {@inheritdoc}
   */
  protected function checkCreateAccess(AccountInterface $account, array $context, $entity_bundle = NULL) {
    return AccessResult::allowedIfHasPermission($account, 'create loan applications')
      ->cachePerPermissions();
  }

}
