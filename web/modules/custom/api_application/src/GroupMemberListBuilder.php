<?php

namespace Drupal\api_application;

use Drupal\Core\Url;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Entity\EntityListBuilder;
use Drupal\Core\Link;

/**
 * Defines a class to build a listing of Group Member entities.
 *
 * @ingroup api_application
 */
class GroupMemberListBuilder extends EntityListBuilder {

  /**
   * {@inheritdoc}
   */
  public function buildHeader() {
    $header['id'] = $this->t('ID');
    $header['name'] = $this->t('Name');
    $header['id_number'] = $this->t('ID Number');
    $header['gender'] = $this->t('Gender');
    $header['position'] = $this->t('Position');
    $header['application'] = $this->t('Application');
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   */
  public function buildRow(EntityInterface $entity) {
    /** @var \Drupal\api_application\Entity\GroupMemberInterface $entity */
    $row['id'] = $entity->id();
    $row['name'] = Link::createFromRoute(
      $entity->label(),
      'entity.group_member.canonical',
      ['group_member' => $entity->id()]
    );
    $row['id_number'] = $entity->getIdNumber();
    $row['gender'] = ucfirst($entity->getGender());
    $row['position'] = $entity->getPosition();

    // Show linked application if exists.
    $application = $entity->getApplication();

    // If no direct application link, try to find application that references
    // this member.
    if (!$application) {
      $application_storage = \Drupal::entityTypeManager()->getStorage('application');
      $query = $application_storage->getQuery()
        ->accessCheck(TRUE)
        ->condition('group_members', $entity->id());
      $application_ids = $query->execute();

      if (!empty($application_ids)) {
        $application_id = reset($application_ids);
        $application = $application_storage->load($application_id);
      }
    }

    if ($application) {
      $row['application'] = Link::createFromRoute(
        $application->label(),
        'entity.application.canonical',
        ['application' => $application->id()]
      );
    }
    else {
      $row['application'] = '-';
    }

    return $row + parent::buildRow($entity);
  }

  /**
   * {@inheritdoc}
   */
  public function render() {
    $build = parent::render();

    // Add custom CSS for styling.
    $build['#attached']['library'][] = 'api_application/admin';

    // Add create button at the top.
    $build['add_link'] = [
      '#type' => 'link',
      '#title' => $this->t('Add new group member'),
      '#url' => Url::fromRoute('entity.group_member.add_form'),
      '#attributes' => [
        'class' => ['button', 'button--primary', 'button--small'],
      ],
      '#weight' => -10,
    ];

    return $build;
  }

  /**
   * {@inheritdoc}
   */
  protected function getEntityIds() {
    $query = $this->getStorage()->getQuery()
      ->accessCheck(TRUE)
      ->sort('id', 'DESC');

    // Only add the pager if a limit is specified.
    if ($this->limit) {
      $query->pager($this->limit);
    }

    return $query->execute();
  }

}
