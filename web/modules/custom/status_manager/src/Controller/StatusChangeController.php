<?php

namespace Drupal\status_manager\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\status_manager\Entity\StatusChangeInterface;

/**
 * Controller for Status Change entities.
 */
class StatusChangeController extends ControllerBase {

  /**
   * Displays a Status Change entity.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The Status Change entity to display.
   *
   * @return array
   *   A render array for the status change.
   */
  public function view(StatusChangeInterface $status_change) {
    $view_builder = $this->entityTypeManager()->getViewBuilder('status_change');
    return $view_builder->view($status_change);
  }

  /**
   * Provides the page title for a Status Change entity.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The Status Change entity.
   *
   * @return string
   *   The page title.
   */
  public function title(StatusChangeInterface $status_change) {
    $target_entity = $status_change->getTargetEntity();
    $target_label = $target_entity ? $target_entity->label() : $this->t('Unknown Entity');

    return $this->t('Status Change for @entity', [
      '@entity' => $target_label,
    ]);
  }

}
