<?php

namespace Drupal\status_manager;

use Drupal\Core\Entity\EntityAccessControlHandler;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Access\AccessResult;

/**
 * Access controller for the Status Change entity.
 *
 * @see \Drupal\status_manager\Entity\StatusChange.
 */
class StatusChangeAccessControlHandler extends EntityAccessControlHandler {

  /**
   * {@inheritdoc}
   */
  protected function checkAccess(EntityInterface $entity, $operation, AccountInterface $account) {
    /** @var \Drupal\status_manager\Entity\StatusChangeInterface $entity */

    // Check admin permission first.
    if ($account->hasPermission('administer status changes')) {
      return AccessResult::allowed()->cachePerPermissions();
    }

    switch ($operation) {
      case 'view':
        // Users can view status changes if they have general view permission
        // or if they own the status change and have view own permission.
        if ($account->hasPermission('view status changes')) {
          return AccessResult::allowed()->cachePerPermissions();
        }
        if ($account->hasPermission('view own status changes') && $entity->getOwnerId() == $account->id()) {
          return AccessResult::allowed()->cachePerPermissions()->cachePerUser();
        }
        return AccessResult::forbidden()->cachePerPermissions();

      case 'update':
        // Users can edit status changes if they have general edit permission
        // or if they own the status change and have edit own permission.
        if ($account->hasPermission('edit status changes')) {
          return AccessResult::allowed()->cachePerPermissions();
        }
        if ($account->hasPermission('edit own status changes') && $entity->getOwnerId() == $account->id()) {
          return AccessResult::allowed()->cachePerPermissions()->cachePerUser();
        }
        return AccessResult::forbidden()->cachePerPermissions();

      case 'delete':
        // Users can delete status changes if they have general delete
        // permission or if they own the status change and have delete own
        // permission.
        if ($account->hasPermission('delete status changes')) {
          return AccessResult::allowed()->cachePerPermissions();
        }
        if ($account->hasPermission('delete own status changes') && $entity->getOwnerId() == $account->id()) {
          return AccessResult::allowed()->cachePerPermissions()->cachePerUser();
        }
        return AccessResult::forbidden()->cachePerPermissions();
    }

    // Unknown operation, no opinion.
    return AccessResult::neutral();
  }

  /**
   * {@inheritdoc}
   */
  protected function checkCreateAccess(AccountInterface $account, array $context, $entity_bundle = NULL) {
    return AccessResult::allowedIfHasPermission($account, 'create status changes')
      ->cachePerPermissions();
  }

}
