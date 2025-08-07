<?php

namespace Drupal\api_application;

use Drupal\Core\Url;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Entity\EntityListBuilder;
use Drupal\Core\Link;

/**
 * Defines a class to build a listing of Application entities.
 *
 * @ingroup api_application
 */
class ApplicationListBuilder extends EntityListBuilder {

  /**
   * {@inheritdoc}
   */
  public function buildHeader() {
    $header['id'] = [
      'data' => $this->t('ID'),
      'class' => ['application-header-id', 'text-center'],
      'width' => '15%',
    ];
    $header['group_name'] = [
      'data' => $this->t('Group Name'),
      'class' => ['application-header-group', 'text-center'],
      'width' => '20%',
    ];
    $header['status'] = [
      'data' => $this->t('Status'),
      'class' => ['application-header-status', 'text-center'],
      'width' => '15%',
    ];
    $header['loan_amount'] = [
      'data' => $this->t('Loan Amount'),
      'class' => ['application-header-amount', 'text-center'],
      'width' => '12%',
    ];
    $header['created'] = [
      'data' => $this->t('Created'),
      'class' => ['application-header-date', 'text-center'],
      'width' => '15%',
    ];
    $header['owner'] = [
      'data' => $this->t('Submitted By'),
      'class' => ['application-header-owner', 'text-center'],
      'width' => '12%',
    ];
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   */
  public function buildRow(EntityInterface $entity) {
    /** @var \Drupal\api_application\Entity\ApplicationInterface $entity */

    $row['id'] = [
      'data' => [
        '#markup' => '<span class="application-id">' . ($entity->getApplicationId() ?: 'APP-' . $entity->id()) . '</span>',
      ],
      'class' => ['text-center'],
    ];

    $row['group_name'] = [
      'data' => Link::createFromRoute(
        $entity->getGroupName(),
        'entity.application.canonical',
        ['application' => $entity->id()],
        ['attributes' => ['class' => ['application-group-link']]]
      ),
      'class' => ['text-center'],
    ];

    // Enhanced status with colored badge and icon.
    $status = $entity->getStatus();
    $status_config = $this->getStatusConfig($status);
    $row['status'] = [
      'data' => [
        '#markup' => sprintf(
          '<span class="status-badge status-badge--%s" title="%s">%s</span>',
          $status,
          $this->getStatusDescription($status),
          $status_config['label']
        ),
      ],
      'class' => ['text-center'],
    ];

    // Enhanced loan amount with better formatting.
    $loan_amount = $entity->getLoanAmount();
    $row['loan_amount'] = [
      'data' => [
        '#markup' => $loan_amount ?
        '<span class="loan-amount">KSh <strong>' . number_format($loan_amount) . '</strong></span>' :
        '<span class="loan-amount loan-amount--empty">-</span>',
      ],
      'class' => ['text-center'],
    ];

    // Enhanced created date - single line format.
    $created_time = $entity->getCreatedTime();
    $formatted_date = \Drupal::service('date.formatter')->format($created_time, 'custom', 'M j, Y - g:i A');
    $row['created'] = [
      'data' => [
        '#markup' => sprintf(
          '<time class="application-date" datetime="%s" title="%s">%s</time>',
          date('c', $created_time),
          \Drupal::service('date.formatter')->format($created_time, 'long'),
          $formatted_date
        ),
      ],
      'class' => ['text-center'],
    ];

    // Enhanced owner display.
    $owner = $entity->getOwner();
    $row['owner'] = [
      'data' => [
        '#markup' => $owner ?
        '<span class="application-owner">' . $owner->getDisplayName() . '</span>' :
        '<span class="application-owner application-owner--empty">-</span>',
      ],
      'class' => ['text-center'],
    ];

    return $row + parent::buildRow($entity);
  }

  /**
   * {@inheritdoc}
   */
  public function getDefaultOperations(EntityInterface $entity) {
    $operations = [];

    // View operation.
    if ($entity->access('view') && $entity->hasLinkTemplate('canonical')) {
      $operations['view'] = [
        'title' => $this->t('View'),
        'weight' => 0,
        'url' => $this->ensureDestination($entity->toUrl()),
      ];
    }

    // Download PDF operation.
    if ($entity->access('view')) {
      $operations['download_pdf'] = [
        'title' => $this->t('Download PDF'),
        'weight' => 5,
        'url' => Url::fromRoute(
          'api_application.download_pdf',
          ['application' => $entity->id()],
          ['attributes' => ['class' => ['button', 'button--small', 'button--action-download']]]
        ),
      ];
    }

    // Send Email operation.
    if ($entity->access('view')) {
      $operations['send_email'] = [
        'title' => $this->t('Send Email'),
        'weight' => 6,
        'url' => Url::fromRoute(
          'api_application.send_email_form',
          ['application' => $entity->id()],
          [
            'attributes' => [
              'class' => ['button', 'button--small', 'button--action-email', 'use-ajax'],
              'data-dialog-type' => 'modal',
              'data-dialog-options' => json_encode(['width' => 500]),
            ],
          ]
        ),
      ];
    }

    // Edit operation.
    if ($entity->access('update') && $entity->hasLinkTemplate('edit-form')) {
      $operations['edit'] = [
        'title' => $this->t('Edit'),
        'weight' => 10,
        'url' => $this->ensureDestination($entity->toUrl('edit-form')),
      ];
    }

    // Delete operation.
    if ($entity->access('delete') && $entity->hasLinkTemplate('delete-form')) {
      $operations['delete'] = [
        'title' => $this->t('Delete'),
        'weight' => 100,
        'url' => $this->ensureDestination($entity->toUrl('delete-form')),
        'attributes' => [
          'class' => ['button', 'button--danger', 'button--small'],
        ],
      ];
    }

    return $operations;
  }

  /**
   * {@inheritdoc}
   */
  public function render() {
    $build = parent::render();

    // Add custom CSS for styling.
    $build['#attached']['library'][] = 'api_application/admin';
    $build['#attached']['library'][] = 'api_application/filters';

    // Add AJAX library for modal operations.
    $build['#attached']['library'][] = 'core/drupal.ajax';
    $build['#attached']['library'][] = 'core/drupal.dialog.ajax';

    // Add wrapper classes for better styling.
    $build['table']['#attributes']['class'][] = 'application-listing-table';
    $build['#prefix'] = '<div class="application-listing-wrapper">';
    $build['#suffix'] = '</div>';

    // Add filter form using Drupal Form API.
    $filter_form = \Drupal::formBuilder()->getForm('Drupal\api_application\Form\ApplicationFilterForm');
    $build['filters'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['application-filters-wrapper']],
      '#weight' => -20,
      'form' => $filter_form,
    ];

    // Add summary information with status breakdown.
    $total_count = $this->getStorage()->getQuery()->accessCheck(TRUE)->count()->execute();

    // Get status counts.
    $status_counts = [];
    $statuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'closed'];
    foreach ($statuses as $status) {
      $count = $this->getStorage()->getQuery()
        ->accessCheck(TRUE)
        ->condition('status', $status)
        ->count()
        ->execute();
      if ($count > 0) {
        $status_counts[$status] = $count;
      }
    }

    $summary_text = '<span class="total-count">' .
                    $this->formatPlural($total_count, '1 application', '@count applications') .
                    '</span>';

    if (!empty($status_counts)) {
      $status_breakdown = [];
      foreach ($status_counts as $status => $count) {
        $config = $this->getStatusConfig($status);
        $status_breakdown[] = '<span class="status-summary status-summary--' . $status . '">' .
                                 $count . ' ' . $config['label'] .
                                 '</span>';
      }
      $summary_text .= '<div class="status-breakdown">' . implode('', $status_breakdown) . '</div>';
    }

    $build['summary'] = [
      '#markup' => '<div class="application-listing-summary">' . $summary_text . '</div>',
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

    // Add filters if they exist in the request.
    $request = \Drupal::request();

    // Status filter.
    if ($status = $request->query->get('status')) {
      $query->condition('status', $status);
    }

    // Search filter - fixed for better searching.
    if ($search = $request->query->get('search')) {
      $search = trim($search);
      if (!empty($search)) {
        $group = $query->orConditionGroup()
          ->condition('group_name', '%' . $search . '%', 'LIKE')
          ->condition('group_registration_number', '%' . $search . '%', 'LIKE');
        $query->condition($group);
      }
    }

    // Date range filters (using created date as submission date proxy).
    if ($date_from = $request->query->get('date_from')) {
      $timestamp_from = strtotime($date_from . ' 00:00:00');
      if ($timestamp_from) {
        $query->condition('created', $timestamp_from, '>=');
      }
    }

    if ($date_to = $request->query->get('date_to')) {
      $timestamp_to = strtotime($date_to . ' 23:59:59');
      if ($timestamp_to) {
        $query->condition('created', $timestamp_to, '<=');
      }
    }

    // Always add pager with default limit of 50 if not specified.
    $limit = $this->limit ?: 20;
    $query->pager($limit);

    return $query->execute();
  }

  /**
   * Get human-readable status label.
   *
   * @param string $status
   *   The status machine name.
   *
   * @return string
   *   The status label.
   */
  protected function getStatusLabel($status) {
    $statuses = [
      'draft' => $this->t('Draft'),
      'submitted' => $this->t('Submitted'),
      'under_review' => $this->t('Under Review'),
      'approved' => $this->t('Approved'),
      'rejected' => $this->t('Rejected'),
      'disbursed' => $this->t('Disbursed'),
      'closed' => $this->t('Closed'),
    ];

    return $statuses[$status] ?? $status;
  }

  /**
   * Get status configuration with label.
   *
   * @param string $status
   *   The status machine name.
   *
   * @return array
   *   Array with 'label' keys.
   */
  protected function getStatusConfig($status) {
    $configs = [
      'draft' => [
        'label' => $this->t('Draft'),
      ],
      'submitted' => [
        'label' => $this->t('Submitted'),
      ],
      'under_review' => [
        'label' => $this->t('Under Review'),
      ],
      'approved' => [
        'label' => $this->t('Approved'),
      ],
      'rejected' => [
        'label' => $this->t('Rejected'),
      ],
      'disbursed' => [
        'label' => $this->t('Disbursed'),
      ],
      'closed' => [
        'label' => $this->t('Closed'),
      ],
    ];

    return $configs[$status] ?? [
      'label' => $status,
    ];
  }

  /**
   * Get detailed status description.
   *
   * @param string $status
   *   The status machine name.
   *
   * @return string
   *   The status description.
   */
  protected function getStatusDescription($status) {
    $descriptions = [
      'draft' => $this->t('Application is being prepared and not yet submitted'),
      'submitted' => $this->t('Application has been submitted and is awaiting review'),
      'under_review' => $this->t('Application is currently being reviewed by administrators'),
      'approved' => $this->t('Application has been approved and is ready for disbursement'),
      'rejected' => $this->t('Application has been rejected'),
      'disbursed' => $this->t('Loan has been disbursed to the group'),
      'closed' => $this->t('Application has been closed'),
    ];

    return $descriptions[$status] ?? $this->t('Status: @status', ['@status' => $status]);
  }

}
