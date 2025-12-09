<?php

namespace Drupal\api_application;

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
    $header['id'] = [
      'data' => $this->t('ID'),
      'class' => ['group-member-header-id'],
      'width' => '60px',
    ];
    $header['name'] = [
      'data' => $this->t('Name'),
      'class' => ['group-member-header-name'],
      'width' => '25%',
    ];
    $header['id_number'] = [
      'data' => $this->t('ID Number'),
      'class' => ['group-member-header-id-number'],
      'width' => '140px',
    ];
    $header['gender'] = [
      'data' => $this->t('Gender'),
      'class' => ['group-member-header-gender'],
      'width' => '100px',
    ];
    $header['position'] = [
      'data' => $this->t('Position of member'),
      'class' => ['group-member-header-position'],
      'width' => '150px',
    ];
    $header['application'] = [
      'data' => $this->t('Application'),
      'class' => ['group-member-header-application'],
    ];
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   */
  public function buildRow(EntityInterface $entity) {
    /** @var \Drupal\api_application\Entity\GroupMemberInterface $entity */
    $row['id'] = [
      'data' => [
        '#markup' => '<span class="group-member-id">' . $entity->id() . '</span>',
      ],
      'class' => ['text-center'],
    ];

    $row['name'] = [
      'data' => Link::createFromRoute(
        $entity->label(),
        'entity.group_member.canonical',
        ['group_member' => $entity->id()],
        ['attributes' => ['class' => ['group-member-link']]]
      ),
    ];

    $row['id_number'] = [
      'data' => [
        '#markup' => '<span class="group-member-id-number">' . ($entity->getIdNumber() ?: '-') . '</span>',
      ],
    ];

    $gender = $entity->getGender();
    $row['gender'] = [
      'data' => [
        '#markup' => $gender ? '<span class="gender-badge gender-badge--' . $gender . '">' . ucfirst($gender) . '</span>' : '<span class="gender-badge gender-badge--unknown">-</span>',
      ],
      'class' => ['text-center'],
    ];

    $position = $entity->getPosition();
    $position_name = $position ? $position->getName() : NULL;
    $row['position'] = [
      'data' => [
        '#markup' => $position_name ? '<span class="position-badge">' . $position_name . '</span>' : '<span class="position-badge position-badge--empty">-</span>',
      ],
    ];

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
      $row['application'] = [
        'data' => Link::createFromRoute(
          $application->label(),
          'entity.application.canonical',
          ['application' => $application->id()],
          ['attributes' => ['class' => ['application-link']]]
        ),
      ];
    }
    else {
      $row['application'] = [
        'data' => [
          '#markup' => '<span class="application-link--empty">-</span>',
        ],
      ];
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

    // Add wrapper classes for better styling.
    $build['table']['#attributes']['class'][] = 'group-member-listing-table';
    $build['#prefix'] = '<div class="group-member-listing-wrapper">';
    $build['#suffix'] = '</div>';

    // Add summary information.
    $total_count = $this->getStorage()->getQuery()->accessCheck(TRUE)->count()->execute();
    $build['summary'] = [
      '#markup' => '<div class="group-member-listing-summary">' .
      '<span class="total-count">' .
      $this->formatPlural($total_count, '1 group member', '@count group members') .
      '</span></div>',
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

    // Always add pager with default limit of 50 if not specified.
    $limit = $this->limit ?: 20;
    $query->pager($limit);

    return $query->execute();
  }

}
