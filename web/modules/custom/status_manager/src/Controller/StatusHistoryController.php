<?php

namespace Drupal\status_manager\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Link;
use Drupal\Core\Url;
use Drupal\status_manager\Service\StatusTracker;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Controller for displaying status history.
 */
class StatusHistoryController extends ControllerBase {

  /**
   * The status tracker service.
   *
   * @var \Drupal\status_manager\Service\StatusTracker
   */
  protected $statusTracker;

  /**
   * Constructs a StatusHistoryController object.
   *
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\status_manager\Service\StatusTracker $status_tracker
   *   The status tracker service.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    StatusTracker $status_tracker,
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->statusTracker = $status_tracker;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('status_manager.status_tracker')
    );
  }

  /**
   * Displays status history for a specific entity.
   *
   * @param string $entity_type
   *   The entity type ID.
   * @param string $entity_id
   *   The entity ID.
   *
   * @return array
   *   A render array for the status history.
   */
  public function entityHistory($entity_type, $entity_id) {
    // Load the target entity.
    try {
      $storage = $this->entityTypeManager->getStorage($entity_type);
      $target_entity = $storage->load($entity_id);

      if (!$target_entity) {
        throw new NotFoundHttpException();
      }
    }
    catch (\Exception $e) {
      throw new NotFoundHttpException();
    }

    // Get status change history.
    $history = $this->statusTracker->getStatusChangeHistory($target_entity, NULL, 100);

    $build = [];

    // Page header with entity link.
    $build['header'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['page-header']],
    ];

    $entity_link = '';
    if ($target_entity->hasLinkTemplate('canonical')) {
      $entity_link = $target_entity->toLink($target_entity->label(), 'canonical')->toString();
    }
    else {
      $entity_link = $target_entity->label();
    }

    $build['header']['title'] = [
      '#markup' => '<h1>' . $this->t('Status History for @entity', [
        '@entity' => $entity_link,
      ]) . '</h1>',
    ];

    // Breadcrumb-style navigation.
    $build['navigation'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['status-history-nav']],
    ];

    $nav_links = [];

    // Link back to entity.
    if ($target_entity->hasLinkTemplate('canonical')) {
      $nav_links[] = $target_entity->toLink($this->t('← Back to @entity', [
        '@entity' => $target_entity->getEntityType()->getLabel(),
      ]), 'canonical')->toString();
    }

    // Link to all status changes.
    $nav_links[] = Link::fromTextAndUrl(
      $this->t('All Status Updates'),
      Url::fromRoute('status_manager.all_updates')
    )->toString();

    // Link to entity list if available.
    try {
      $entity_type_def = $this->entityTypeManager->getDefinition($entity_type);
      if ($entity_type_def->hasLinkTemplate('collection')) {
        $nav_links[] = Link::fromTextAndUrl(
          $this->t('All @entities', ['@entities' => $entity_type_def->getPluralLabel()]),
          Url::fromRoute($entity_type_def->getLinkTemplate('collection'))
        )->toString();
      }
    }
    catch (\Exception $e) {
      // Ignore if collection route doesn't exist.
    }

    $build['navigation']['links'] = [
      '#markup' => '<div class="nav-links">' . implode(' | ', $nav_links) . '</div>',
    ];

    // Entity summary section.
    $build['entity_summary'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['entity-summary']],
    ];

    $build['entity_summary']['entity_details'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['entity-details-card']],
    ];

    $build['entity_summary']['entity_details']['header'] = [
      '#markup' => '<h3 class="details-card-header">' . $this->t('Entity Information') . '</h3>',
    ];

    $build['entity_summary']['entity_details']['details'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['details-grid']],
    ];

    // Entity information.
    $entity_info = [
      'type' => $target_entity->getEntityType()->getLabel(),
      'id' => $target_entity->id(),
      'label' => $target_entity->label(),
    ];

    // Add bundle information if available.
    if ($target_entity->getEntityType()->hasKey('bundle')) {
      $bundle = $target_entity->bundle();
      $bundle_info = $this->entityTypeManager->getDefinition($entity_type)->getBundleEntityType();
      if ($bundle_info) {
        $bundle_storage = $this->entityTypeManager->getStorage($bundle_info);
        $bundle_entity = $bundle_storage->load($bundle);
        if ($bundle_entity) {
          $entity_info['bundle'] = $bundle_entity->label();
        }
      }
    }

    // Add creation date if available.
    if ($target_entity->hasField('created')) {
      $created = $target_entity->get('created')->value;
      if ($created) {
        // @phpcs:disable
        $entity_info['created'] = \Drupal::service('date.formatter')->format($created, 'medium');
        // @phpcs:enable
      }
    }

    foreach ($entity_info as $key => $value) {
      $build['entity_summary']['entity_details']['details'][$key] = [
        '#type' => 'container',
        '#attributes' => ['class' => ['detail-item']],
        'label' => [
          '#markup' => '<div class="detail-label">' . ucfirst($key) . '</div>',
        ],
        'value' => [
          '#markup' => '<div class="detail-value">' . $this->t('@value', ['@value' => $value]) . '</div>',
        ],
      ];
    }

    // Current status cards.
    $build['entity_summary']['status_cards'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['status-cards']],
    ];

    // Get current status from common status fields.
    $status_fields = ['status', 'moderation_state', 'field_status', 'state'];
    foreach ($status_fields as $field_name) {
      if ($target_entity->hasField($field_name) && !$target_entity->get($field_name)->isEmpty()) {
        $field_value = $target_entity->get($field_name)->value;
        $field_label = $target_entity->getFieldDefinition($field_name)->getLabel();

        $build['entity_summary']['status_cards'][$field_name] = [
          '#type' => 'container',
          '#attributes' => ['class' => ['status-card', 'status-' . strtolower(str_replace(' ', '-', $field_value))]],
          'label' => [
            '#markup' => '<div class="status-label">' . $field_label . '</div>',
          ],
          'value' => [
            '#markup' => '<div class="status-value">' . $field_value . '</div>',
          ],
        ];
      }
    }

    // Status history section.
    $build['history_section'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['status-history-section']],
    ];

    $build['history_section']['header'] = [
      '#markup' => '<h2 class="history-header">' . $this->t('Status Change History') . '</h2>',
    ];

    if (!empty($history)) {
      $build['history_section']['description'] = [
        '#markup' => '<p class="history-description">' . $this->t('Complete history of status changes for this entity (@count total changes).', [
          '@count' => count($history),
        ]) . '</p>',
      ];

      $build['history_section']['table'] = $this->buildHistoryTable($history);
    }
    else {
      $build['history_section']['empty'] = [
        '#type' => 'container',
        '#attributes' => ['class' => ['empty-state']],
        'message' => [
          '#markup' => '<p><em>' . $this->t('No status changes have been recorded for this entity yet.') . '</em></p>',
        ],
        'help' => [
          '#markup' => '<p>' . $this->t("Status changes will appear here when the entity's status fields are modified.") . '</p>',
        ],
      ];
    }

    // Add CSS and JS.
    $build['#attached']['library'][] = 'status_manager/status_history';

    return $build;
  }

  /**
   * Builds the status history table.
   *
   * @param array $history
   *   Array of status change entities.
   *
   * @return array
   *   A render array for the history table.
   */
  protected function buildHistoryTable(array $history) {
    $header = [
      $this->t('Date'),
      $this->t('Field'),
      $this->t('Status Change'),
      $this->t('Source'),
      $this->t('User'),
      $this->t('Notification'),
      $this->t('Notes'),
    ];

    $rows = [];
    foreach ($history as $status_change) {
      $user = $status_change->getOwner();
      // @phpcs:disable
      $created = \Drupal::service('date.formatter')->format($status_change->getCreatedTime(), 'short');
      // @phpcs:enable
      $status_change_display = '';
      if ($status_change->getOldStatus()) {
        $status_change_display = '<span class="old-status">' . $status_change->getOldStatus() . '</span> → ';
      }
      $status_change_display .= '<span class="new-status">' . $status_change->getNewStatus() . '</span>';

      $notification_display = $status_change->getNotificationType();
      if ($status_change->getNotificationStatus() !== 'none') {
        $notification_display .= ' (' . $status_change->getNotificationStatus() . ')';
      }

      $notes = $status_change->getNotes();
      $notes_display = '';
      if ($notes) {
        if (strlen($notes) > 100) {
          $short_notes = substr($notes, 0, 100) . '...';
          $notes_display = $short_notes . ' <a href="#" class="toggle-note">Show more</a>';
          $notes_display .= '<div class="full-notes" style="display: none;">' . $notes . '</div>';
        }
        else {
          $notes_display = $notes;
        }
      }

      $rows[] = [
        'data' => [
          ['data' => $created, 'class' => ['date-cell']],
          $status_change->getStatusField(),
          ['data' => ['#markup' => $status_change_display], 'class' => ['status-change-cell']],
          ['data' => ucfirst($status_change->getSource()), 'class' => ['source-cell']],
          $user->getDisplayName(),
          $notification_display,
          ['data' => ['#markup' => $notes_display], 'class' => ['notes-cell']],
        ],
        'class' => ['status-change-row'],
      ];
    }

    return [
      '#type' => 'table',
      '#header' => $header,
      '#rows' => $rows,
      '#attributes' => [
        'class' => ['status-history-table', 'responsive-table'],
      ],
      '#empty' => $this->t('No status changes found.'),
    ];
  }

}
