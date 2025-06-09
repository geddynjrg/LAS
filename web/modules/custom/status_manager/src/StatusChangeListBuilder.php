<?php

namespace Drupal\status_manager;

use Drupal\Core\Url;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Entity\EntityListBuilder;
use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Link;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Defines a class to build a listing of status change entities.
 */
class StatusChangeListBuilder extends EntityListBuilder {

  /**
   * The date formatter service.
   *
   * @var \Drupal\Core\Datetime\DateFormatterInterface
   */
  protected $dateFormatter;

  /**
   * Constructs a new StatusChangeListBuilder object.
   *
   * @param \Drupal\Core\Entity\EntityTypeInterface $entity_type
   *   The entity type definition.
   * @param \Drupal\Core\Entity\EntityStorageInterface $storage
   *   The entity storage class.
   * @param \Drupal\Core\Datetime\DateFormatterInterface $date_formatter
   *   The date formatter service.
   */
  public function __construct(
    EntityTypeInterface $entity_type,
    EntityStorageInterface $storage,
    DateFormatterInterface $date_formatter,
  ) {
    parent::__construct($entity_type, $storage);
    $this->dateFormatter = $date_formatter;
  }

  /**
   * {@inheritdoc}
   */
  public static function createInstance(ContainerInterface $container, EntityTypeInterface $entity_type) {
    return new static(
      $entity_type,
      $container->get('entity_type.manager')->getStorage($entity_type->id()),
      $container->get('date.formatter')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function buildHeader() {
    $header = [
      'id' => $this->t('ID'),
      'target_entity' => $this->t('Target Entity'),
      'status_field' => $this->t('Status Field'),
      'status_change' => $this->t('Status Change'),
      'notification' => $this->t('Notification'),
      'source' => $this->t('Source'),
      'created' => $this->t('Created'),
      'user' => $this->t('User'),
    ];
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   */
  public function buildRow(EntityInterface $entity) {
    /** @var \Drupal\status_manager\Entity\StatusChangeInterface $entity */
    $target_entity = $entity->getTargetEntity();
    $target_label = $this->t('Unknown');

    if ($target_entity) {
      $target_label = $target_entity->label() . ' (' . $entity->getTargetEntityType() . ':' . $entity->getTargetEntityId() . ')';

      // Try to create a link to the target entity if it has a canonical route.
      try {
        if ($target_entity->hasLinkTemplate('canonical')) {
          $target_label = Link::fromTextAndUrl(
            $target_entity->label(),
            $target_entity->toUrl('canonical')
          )->toString() . ' (' . $entity->getTargetEntityType() . ':' . $entity->getTargetEntityId() . ')';
        }
      }
      catch (\Exception $e) {
        // If link creation fails, just use the label.
      }
    }

    $row = [
      'id' => $entity->id(),
      'target_entity' => [
        'data' => [
          '#markup' => $target_label,
        ],
      ],
      'status_field' => $entity->getStatusField(),
      'status_change' => [
        'data' => [
          '#markup' => '<span class="old-status">' . ($entity->getOldStatus() ?: $this->t('(none)')) . '</span> → <span class="new-status">' . $entity->getNewStatus() . '</span>',
        ],
      ],
      'notification' => $entity->getNotificationType() . ' (' . $entity->getNotificationStatus() . ')',
      'source' => $entity->getSource(),
      'created' => $this->dateFormatter->format($entity->getCreatedTime(), 'short'),
      'user' => $entity->getOwner()->getAccountName(),
    ];
    return $row + parent::buildRow($entity);
  }

  /**
   * {@inheritdoc}
   */
  public function render() {
    $build = parent::render();

    // Add custom CSS for styling.
    $build['#attached']['library'][] = 'status_manager/admin';

    // Add create button at the top.
    $build['add_link'] = [
      '#type' => 'link',
      '#title' => $this->t('Add new status change'),
      '#url' => Url::fromRoute('entity.status_change.add_form'),
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
      ->sort('created', 'DESC');

    // Only add the pager if a limit is specified.
    if ($this->limit) {
      $query->pager($this->limit);
    }

    return $query->execute();
  }

}
