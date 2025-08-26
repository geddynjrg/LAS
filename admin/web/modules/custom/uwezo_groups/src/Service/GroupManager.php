<?php

namespace Drupal\uwezo_groups\Service;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Access\AccessResultInterface;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\group\Entity\GroupMembership;
use Drupal\Core\Entity\EntityTypeManagerInterface;

/**
 * Service for managing group-related operations and access.
 */
class GroupManager {

  /**
   * Service ID constant.
   */
  const SERVICE_ID = 'uwezo_groups.group_manager';

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Constructs a new GroupManager.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct(EntityTypeManagerInterface $entity_type_manager) {
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * Check if a user has access to an entity based on constituency.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The entity to check access for.
   * @param string $operation
   *   The operation being performed (view, update, etc.).
   * @param \Drupal\Core\Session\AccountInterface $account
   *   The user account to check access for.
   *
   * @return \Drupal\Core\Access\AccessResultInterface
   *   The access result.
   */
  public function checkAccess(EntityInterface $entity, string $operation, AccountInterface $account): AccessResultInterface {
    // Only handle view and update operations for entities with constituencies.
    if (!in_array($operation, ['view', 'update']) || 
        !$entity->hasField('constituency') || 
        $entity->get('constituency')->isEmpty()) {
      return AccessResult::neutral();
    }

    $constituency = $entity->get('constituency')->entity;
    if (!$constituency) {
      return AccessResult::neutral();
    }

    // Check constituency-specific access (access policy grants these permissions).
    if ($account->hasPermission("administer constituency applications:{$constituency->id()}")) {
      return AccessResult::allowed()
        ->cachePerPermissions()
        ->cachePerUser()
        ->addCacheableDependency($constituency);
    }

    return AccessResult::neutral();
  }

  /**
   * Check if user has any group assignments.
   *
   * @param \Drupal\Core\Session\AccountInterface $account
   *   The user account.
   *
   * @return bool
   *   TRUE if user has group assignments, FALSE otherwise.
   */
  public function userHasGroupAssignments(AccountInterface $account): bool {
    $memberships = GroupMembership::loadByUser($account);
    return !empty($memberships);
  }

  /**
   * Get constituency IDs the user has access to through group memberships.
   *
   * @param \Drupal\Core\Session\AccountInterface $account
   *   The user account.
   *
   * @return array
   *   Array of constituency term IDs.
   */
  public function getAccessibleConstituencyIds(AccountInterface $account): array {
    $accessible_ids = [];
    $memberships = GroupMembership::loadByUser($account);

    if (empty($memberships)) {
      return $accessible_ids;
    }

    foreach ($memberships as $membership) {
      $group = $membership->getGroup();
      
      // Get constituencies directly assigned to the group.
      if ($group->hasField('field_assigned_constituencies') && !$group->get('field_assigned_constituencies')->isEmpty()) {
        foreach ($group->get('field_assigned_constituencies')->referencedEntities() as $constituency) {
          $accessible_ids[] = $constituency->id();
        }
      }
    }

    return array_unique($accessible_ids);
  }

}