<?php

declare(strict_types=1);

namespace Drupal\api_application\AccessPolicy;

use Drupal\Core\Session\AccessPolicyBase;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Session\RefinableCalculatedPermissionsInterface;
use Drupal\Core\Session\CalculatedPermissionsItem;
use Drupal\uwezo_groups\Service\GroupManager;

/**
 * Access policy for group-based application permissions.
 */
final class ApplicationAccessPolicy extends AccessPolicyBase {

  /**
   * The group manager service.
   */
  protected GroupManager $groupManager;

  /**
   * Constructs a new ApplicationAccessPolicy.
   *
   * @param \Drupal\uwezo_groups\Service\GroupManager $group_manager
   *   The group manager service.
   */
  public function __construct(GroupManager $group_manager) {
    $this->groupManager = $group_manager;
  }

  /**
   * {@inheritdoc}
   */
  public function calculatePermissions(AccountInterface $account, string $scope): RefinableCalculatedPermissionsInterface {
    $calculated_permissions = parent::calculatePermissions($account, $scope);

    // Skip for anonymous users and super admin.
    if ($account->isAnonymous() || ((int) $account->id()) === 1) {
      return $calculated_permissions;
    }

    // Check if user has any group memberships (review groups).
    if ($this->groupManager->userHasGroupAssignments($account)) {
      // Get constituency IDs the user has access to through group memberships.
      $accessible_constituency_ids = $this->groupManager->getAccessibleConstituencyIds($account);

      // Collect all permissions to grant.
      $permissions = [];

      // Grant base permissions for any review group member.
      $permissions[] = 'view the administration theme';
      // Only access to listing page.
      $permissions[] = 'access loan applications listing';
      // Needed to see admin menu.
      $permissions[] = 'access toolbar';
      // Needed to see admin menu items.
      $permissions[] = 'access administration pages';
      // Needed to see content menu section.
      $permissions[] = 'access content overview';

      // Grant specific admin permissions for each accessible constituency.
      foreach ($accessible_constituency_ids as $constituency_id) {
        $permissions[] = "administer constituency applications:$constituency_id";
      }

      // Add all permissions at once.
      if (!empty($permissions)) {
        $calculated_permissions->addItem(new CalculatedPermissionsItem($permissions));
      }
    }

    return $calculated_permissions;
  }

  /**
   * {@inheritdoc}
   */
  public function getPersistentCacheContexts(): array {
    // Use the Group module's cache context, otherwise fall back to user.
    return ['user', 'user.roles'];
  }

}
