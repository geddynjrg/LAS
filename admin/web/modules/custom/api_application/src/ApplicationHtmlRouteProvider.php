<?php

namespace Drupal\api_application;

use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Entity\Routing\AdminHtmlRouteProvider;
use Symfony\Component\Routing\Route;

/**
 * Provides routes for Application entities.
 *
 * @see \Drupal\Core\Entity\Routing\AdminHtmlRouteProvider
 * @see \Drupal\Core\Entity\Routing\DefaultHtmlRouteProvider
 */
class ApplicationHtmlRouteProvider extends AdminHtmlRouteProvider {

  /**
   * {@inheritdoc}
   */
  public function getRoutes(EntityTypeInterface $entity_type) {
    $collection = parent::getRoutes($entity_type);

    $entity_type_id = $entity_type->id();

    // Override the collection route to allow viewing with listing permission.
    if ($collection_route = $collection->get("entity.{$entity_type_id}.collection")) {
      // Change the permission requirement to allow admin, view all, or listing.
      $collection_route->setRequirement('_permission', 'administer loan applications+view loan applications+access loan applications listing');
    }

    // @todo Implement multi-step forms.
    // Add settings route.
    if ($settings_route = $this->getSettingsFormRoute($entity_type)) {
      $route_name = "entity.{$entity_type_id}.settings";
      $collection->add($route_name, $settings_route);
    }

    return $collection;
  }

  /**
   * Gets the settings form route.
   *
   * @param \Drupal\Core\Entity\EntityTypeInterface $entity_type
   *   The entity type.
   *
   * @return \Symfony\Component\Routing\Route|null
   *   The generated route, if available.
   */
  protected function getSettingsFormRoute(EntityTypeInterface $entity_type) {
    if (!$entity_type->getBundleEntityType()) {
      $route = new Route("/admin/structure/{$entity_type->id()}/settings");
      $route
        ->setDefaults([
          '_form' => '\Drupal\api_application\Form\ApplicationSettingsForm',
          '_title' => "{$entity_type->getLabel()} settings",
        ])
        ->setRequirement('_permission', $entity_type->getAdminPermission())
        ->setOption('_admin_route', TRUE);

      return $route;
    }
  }

}
