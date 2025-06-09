<?php

namespace Drupal\status_manager;

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
    // Set default limit for pagination.
    $this->limit = 20;
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
      'id' => [
        'data' => $this->t('ID'),
        'class' => ['status-change-header-id'],
        'width' => '60px',
      ],
      'target_entity' => [
        'data' => $this->t('Target Entity'),
        'class' => ['status-change-header-entity'],
        'width' => '25%',
      ],
      'status_field' => [
        'data' => $this->t('Field'),
        'class' => ['status-change-header-field'],
        'width' => '120px',
      ],
      'status_change' => [
        'data' => $this->t('Status Change'),
        'class' => ['status-change-header-change'],
        'width' => '180px',
      ],
      'notification' => [
        'data' => $this->t('Notification'),
        'class' => ['status-change-header-notification'],
        'width' => '140px',
      ],
      'source' => [
        'data' => $this->t('Source'),
        'class' => ['status-change-header-source'],
        'width' => '100px',
      ],
      'created' => [
        'data' => $this->t('Created'),
        'class' => ['status-change-header-date'],
        'width' => '180px',
      ],
      'user' => [
        'data' => $this->t('User'),
        'class' => ['status-change-header-user'],
        'width' => '120px',
      ],
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
    $target_markup = '<span class="status-change-target status-change-target--unknown">Unknown</span>';

    if ($target_entity) {
      $entity_type_label = $target_entity->getEntityType()->getLabel();
      $entity_id = $entity->getTargetEntityId();

      // Try to create a link to the target entity if it has a canonical route.
      try {
        if ($target_entity->hasLinkTemplate('canonical')) {
          $target_markup = Link::fromTextAndUrl(
            $target_entity->label(),
            $target_entity->toUrl('canonical'),
            ['attributes' => ['class' => ['status-change-entity-link']]]
          )->toString() . ' <span class="entity-type-badge">' . $entity_type_label . ' #' . $entity_id . '</span>';
        }
        else {
          $target_markup = '<span class="status-change-entity-name">' . $target_entity->label() . '</span> <span class="entity-type-badge">' . $entity_type_label . ' #' . $entity_id . '</span>';
        }
      }
      catch (\Exception $e) {
        // If link creation fails, just use the label.
        $target_markup = '<span class="status-change-entity-name">' . $target_entity->label() . '</span> <span class="entity-type-badge">' . $entity_type_label . ' #' . $entity_id . '</span>';
      }
    }

    // Format the date.
    $created_time = $entity->getCreatedTime();
    $formatted_date = $this->dateFormatter->format($created_time, 'custom', 'M j, Y - g:i A');

    // Format notification status.
    $notification_type = $entity->getNotificationType();
    $notification_status = $entity->getNotificationStatus();
    $notification_class = 'notification-badge--' . str_replace('_', '-', $notification_status);
    $notification_markup = '<span class="notification-badge ' . $notification_class . '">' .
                          $notification_type .
                          ($notification_status !== 'none' ? ' (' . $notification_status . ')' : '') .
                          '</span>';

    $row = [
      'id' => [
        'data' => [
          '#markup' => '<span class="status-change-id">' . $entity->id() . '</span>',
        ],
        'class' => ['text-center'],
      ],
      'target_entity' => [
        'data' => [
          '#markup' => $target_markup,
        ],
      ],
      'status_field' => [
        'data' => [
          '#markup' => '<span class="field-name-badge">' . $entity->getStatusField() . '</span>',
        ],
      ],
      'status_change' => [
        'data' => [
          '#markup' => '<span class="status-change-flow"><span class="old-status">' .
          ($entity->getOldStatus() ?: $this->t('(none)')) .
          '</span> <span class="status-arrow">→</span> <span class="new-status">' .
          $entity->getNewStatus() . '</span></span>',
        ],
      ],
      'notification' => [
        'data' => [
          '#markup' => $notification_markup,
        ],
      ],
      'source' => [
        'data' => [
          '#markup' => '<span class="source-badge source-badge--' . $entity->getSource() . '">' . ucfirst($entity->getSource()) . '</span>',
        ],
        'class' => ['text-center'],
      ],
      'created' => [
        'data' => [
          '#markup' => sprintf(
            '<time class="status-change-date" datetime="%s" title="%s">%s</time>',
            date('c', $created_time),
            $this->dateFormatter->format($created_time, 'long'),
            $formatted_date
          ),
        ],
      ],
      'user' => [
        'data' => [
          '#markup' => '<span class="status-change-user">' . $entity->getOwner()->getDisplayName() . '</span>',
        ],
      ],
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

    // Add wrapper classes for better styling.
    $build['table']['#attributes']['class'][] = 'status-change-listing-table';
    $build['#prefix'] = '<div class="status-change-listing-wrapper">';
    $build['#suffix'] = '</div>';

    // Add summary information.
    $total_count = $this->getStorage()->getQuery()->accessCheck(TRUE)->count()->execute();
    $build['summary'] = [
      '#markup' => '<div class="status-change-listing-summary">' .
      '<span class="total-count">' .
      $this->formatPlural($total_count, '1 status change', '@count status changes') .
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
      ->sort('created', 'DESC');

    // Always add pager with default limit of 20 if not specified.
    $limit = $this->limit ?: 20;
    $query->pager($limit);

    return $query->execute();
  }

}
