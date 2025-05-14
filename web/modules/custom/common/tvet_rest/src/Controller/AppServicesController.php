<?php

namespace Drupal\tvet_rest\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\system\SystemManager;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Controller for app services.
 */
class AppServicesController extends ControllerBase {

  /**
   * The system manager.
   *
   * @var \Drupal\system\SystemManager
   */
  protected $systemManager;

  /**
   * Constructs a AppServicesController object.
   *
   * @param \Drupal\system\SystemManager $system_manager
   *   The system manager.
   */
  public function __construct(SystemManager $system_manager) {
    $this->systemManager = $system_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('system.manager')
    );
  }

  /**
   * Displays a listing of app services.
   *
   * @return array
   *   A render array.
   */
  public function overview() {
    return $this->systemManager->getBlockContents();
  }

}
