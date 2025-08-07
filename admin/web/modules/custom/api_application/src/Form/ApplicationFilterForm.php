<?php

namespace Drupal\api_application\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Provides a filter form for application listings.
 */
class ApplicationFilterForm extends FormBase {

  /**
   * The request stack service.
   *
   * @var \Symfony\Component\HttpFoundation\RequestStack
   */
  protected $requestStack;

  /**
   * Constructs a new ApplicationFilterForm object.
   *
   * @param \Symfony\Component\HttpFoundation\RequestStack $request_stack
   *   The request stack service.
   */
  public function __construct(RequestStack $request_stack) {
    $this->requestStack = $request_stack;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('request_stack')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_application_filter_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $request = $this->requestStack->getCurrentRequest();

    $form['#method'] = 'get';
    $form['#attributes']['class'][] = 'application-filters-form';

    // Search field for group name.
    $form['search'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Search'),
      '#placeholder' => $this->t('Search by group name or registration number...'),
      '#default_value' => $request->query->get('search', ''),
      '#attributes' => [
        'class' => ['filter-search'],
      ],
    ];

    // Status filter.
    $form['status'] = [
      '#type' => 'select',
      '#title' => $this->t('Status'),
      '#options' => [
        '' => $this->t('All Statuses'),
        'draft' => $this->t('Draft'),
        'submitted' => $this->t('Submitted'),
        'under_review' => $this->t('Under Review'),
        'approved' => $this->t('Approved'),
        'rejected' => $this->t('Rejected'),
        'disbursed' => $this->t('Disbursed'),
        'closed' => $this->t('Closed'),
      ],
      '#default_value' => $request->query->get('status', ''),
      '#attributes' => [
        'class' => ['filter-status'],
      ],
    ];

    // Date range filters.
    $form['date_from'] = [
      '#type' => 'date',
      '#title' => $this->t('Created From'),
      '#default_value' => $request->query->get('date_from', ''),
      '#attributes' => [
        'class' => ['filter-date'],
      ],
    ];

    $form['date_to'] = [
      '#type' => 'date',
      '#title' => $this->t('Created To'),
      '#default_value' => $request->query->get('date_to', ''),
      '#attributes' => [
        'class' => ['filter-date'],
      ],
    ];

    // Actions container.
    $form['actions'] = [
      '#type' => 'actions',
      '#attributes' => ['class' => ['filter-actions']],
    ];

    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Apply Filters'),
      '#attributes' => [
        'class' => ['button', 'button--primary', 'filter-submit'],
      ],
    ];

    // Clear filters link.
    $form['actions']['clear'] = [
      '#type' => 'link',
      '#title' => $this->t('Clear'),
      '#url' => Url::fromRoute('entity.application.collection'),
      '#attributes' => [
        'class' => ['button', 'button--secondary', 'filter-clear'],
      ],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    // Get form values.
    $values = $form_state->getValues();

    // Build query parameters from form values.
    $query_params = [];

    if (!empty($values['search'])) {
      $query_params['search'] = $values['search'];
    }

    if (!empty($values['status'])) {
      $query_params['status'] = $values['status'];
    }

    if (!empty($values['date_from'])) {
      $query_params['date_from'] = $values['date_from'];
    }

    if (!empty($values['date_to'])) {
      $query_params['date_to'] = $values['date_to'];
    }

    // Redirect to the same page with query parameters.
    $form_state->setRedirect('entity.application.collection', [], [
      'query' => $query_params,
    ]);
  }

}
