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

    // @todo: Implement multi-step forms
    // Add custom step routes for the multi-step form
    // if ($add_form_route = $collection->get("entity.{$entity_type_id}.add_form")) {
    //   // Override the default add form to start with step 1
    //   $add_form_route->setDefault('_entity_form', "{$entity_type_id}.step1");
    //   
    //   // Add individual step routes
    //   for ($step = 1; $step <= 4; $step++) {
    //     $route = new Route('/application/add/step' . $step);
    //     $route
    //       ->setDefaults([
    //         '_entity_form' => "{$entity_type_id}.step{$step}",
    //         '_title' => 'Create Application - Step ' . $step,
    //       ])
    //       ->setRequirement('_entity_create_access', $entity_type_id)
    //       ->setOption('parameters', [
    //         $entity_type_id => ['type' => 'entity:' . $entity_type_id],
    //       ]);
    //     $collection->add("entity.{$entity_type_id}.add_form.step{$step}", $route);
    //   }
    // }

    // Add a custom status update route
    if ($canonical_route = $collection->get("entity.{$entity_type_id}.canonical")) {
      $status_route = new Route('/application/{application}/status');
      $status_route
        ->setDefaults([
          '_form' => '\Drupal\api_application\Form\ApplicationStatusForm',
          '_title' => 'Update Application Status',
        ])
        ->setRequirement('_entity_access', "{$entity_type_id}.update")
        ->setOption('parameters', [
          $entity_type_id => ['type' => 'entity:' . $entity_type_id],
        ]);
      $collection->add("entity.{$entity_type_id}.status_form", $status_route);
    }

    // Add settings route
    if ($settings_route = $this->getSettingsFormRoute($entity_type)) {
      $collection->add("entity.{$entity_type_id}.settings", $settings_route);
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