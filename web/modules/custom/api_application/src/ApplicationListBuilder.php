<?php

namespace Drupal\api_application;

use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Entity\EntityListBuilder;
use Drupal\Core\Link;
use Drupal\Core\Url;

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
    $header['id'] = $this->t('ID');
    $header['group_name'] = $this->t('Group Name');
    $header['status'] = $this->t('Status');
    $header['loan_amount'] = $this->t('Loan Amount');
    $header['created'] = $this->t('Created');
    $header['owner'] = $this->t('Submitted By');
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   */
  public function buildRow(EntityInterface $entity) {
    /** @var \Drupal\api_application\Entity\ApplicationInterface $entity */
    $row['id'] = $entity->id();
    $row['group_name'] = Link::createFromRoute(
      $entity->getGroupName(),
      'entity.application.canonical',
      ['application' => $entity->id()]
    );
    
    // Add status with colored badge
    $status = $entity->getStatus();
    $status_classes = [
      'draft' => 'color-warning',
      'submitted' => 'color-info',
      'under_review' => 'color-primary',
      'approved' => 'color-success',
      'rejected' => 'color-error',
      'disbursed' => 'color-success',
      'closed' => 'color-disabled',
    ];
    $status_class = $status_classes[$status] ?? '';
    $row['status'] = [
      'data' => [
        '#markup' => '<span class="badge ' . $status_class . '">' . $this->getStatusLabel($status) . '</span>',
      ],
    ];
    
    // Format loan amount with currency
    $loan_amount = $entity->getLoanAmount();
    $row['loan_amount'] = $loan_amount ? 'KSh ' . number_format($loan_amount) : '-';
    
    // Format created date
    $row['created'] = \Drupal::service('date.formatter')->format($entity->getCreatedTime(), 'short');
    
    // Show owner
    $owner = $entity->getOwner();
    $row['owner'] = $owner ? $owner->getDisplayName() : '-';
    
    return $row + parent::buildRow($entity);
  }

  /**
   * {@inheritdoc}
   */
  public function render() {
    $build = parent::render();
    
    // Add custom CSS for styling
    $build['#attached']['library'][] = 'api_application/admin';
    
    // Add create button at the top
    $build['add_link'] = [
      '#type' => 'link',
      '#title' => $this->t('Add new application'),
      '#url' => Url::fromRoute('entity.application.add_form'),
      '#attributes' => [
        'class' => ['button', 'button--primary', 'button--small'],
      ],
      '#weight' => -10,
    ];
    
    // Add filters placeholder
    $build['filters'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['application-filters']],
      '#weight' => -5,
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

    // Add filters if they exist in the request
    $request = \Drupal::request();
    
    if ($status = $request->query->get('status')) {
      $query->condition('status', $status);
    }
    
    if ($search = $request->query->get('search')) {
      $group = $query->orConditionGroup()
        ->condition('group_name', $search, 'CONTAINS')
        ->condition('group_registration_number', $search, 'CONTAINS');
      $query->condition($group);
    }

    // Only add the pager if a limit is specified.
    if ($this->limit) {
      $query->pager($this->limit);
    }
    
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

} 