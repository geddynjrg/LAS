<?php

namespace Drupal\api_application;

use Drupal\Core\Entity\EntityAccessControlHandler;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Access\AccessResult;
use Drupal\uwezo_groups\Service\GroupManager;

/**
 * Access controller for the Application entity.
 *
 * @see \Drupal\api_application\Entity\Application.
 */
class ApplicationAccessControlHandler extends EntityAccessControlHandler {

  /**
   * {@inheritdoc}
   */
  protected function checkAccess(EntityInterface $entity, $operation, AccountInterface $account) {
    /** @var \Drupal\api_application\Entity\ApplicationInterface $entity */

    // Check admin permission first.
    if ($account->hasPermission('administer loan applications')) {
      return AccessResult::allowed()->cachePerPermissions();
    }

    switch ($operation) {
      case 'view':
        // Allow viewing own applications.
        if ($entity->getOwnerId() == $account->id()) {
          return AccessResult::allowed()
            ->cachePerUser()
            ->addCacheableDependency($entity);
        }

        // Check group-based access using the uwezo_groups service.
        $group_manager = \Drupal::service(GroupManager::SERVICE_ID);
        $group_access = $group_manager->checkAccess($entity, $operation, $account);
        if ($group_access->isAllowed()) {
          return $group_access;
        }

        return AccessResult::forbidden();

      case 'update':
        // Allow editing own draft applications.
        if ($entity->getOwnerId() == $account->id() && $entity->getStatus() === 'draft') {
          return AccessResult::allowed()
            ->cachePerUser()
            ->addCacheableDependency($entity);
        }

        // Check group-based access using the uwezo_groups service.
        $group_manager = \Drupal::service(GroupManager::SERVICE_ID);
        $group_access = $group_manager->checkAccess($entity, $operation, $account);
        if ($group_access->isAllowed()) {
          return $group_access;
        }

        return AccessResult::forbidden()
          ->addCacheableDependency($entity);

      case 'delete':
        // Only allow deleting draft applications by owner.
        if ($entity->getOwnerId() == $account->id() && $entity->getStatus() === 'draft') {
          return AccessResult::allowed()
            ->cachePerUser()
            ->addCacheableDependency($entity);
        }

        // Check delete permission for staff.
        return AccessResult::allowedIfHasPermission($account, 'delete loan applications')
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

  /**
   * {@inheritdoc}
   */
  protected function checkFieldAccess($operation, $field_definition, AccountInterface $account, $items = NULL) {
    // Prevent editing certain fields after submission.
    if ($operation == 'edit' && $items) {
      $entity = $items->getEntity();
      if ($entity->getStatus() !== 'draft') {
        $protected_fields = [
          'group_name',
          'group_registration_number',
          'date_registered',
          'group_registration_certificate',
          'list_of_members_certificate',
          'group_members',
          'loan_amount',
          'loan_type',
        ];

        if (in_array($field_definition->getName(), $protected_fields)) {
          return AccessResult::forbidden()
            ->addCacheableDependency($entity);
        }
      }
    }

    return parent::checkFieldAccess($operation, $field_definition, $account, $items);
  }


}
