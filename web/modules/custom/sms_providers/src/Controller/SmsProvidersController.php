<?php

namespace Drupal\sms_providers\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Form\FormBuilderInterface;
use Drupal\sms_providers\Form\SmsProvidersSettingsForm;
use Drupal\sms_providers\Form\SmsTestForm;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Controller for SMS providers configuration and testing.
 */
class SmsProvidersController extends ControllerBase {

  /**
   * The form builder.
   *
   * @var \Drupal\Core\Form\FormBuilderInterface
   */
  protected $formBuilder;

  /**
   * Constructs a SmsProvidersController object.
   *
   * @param \Drupal\Core\Form\FormBuilderInterface $form_builder
   *   The form builder.
   */
  public function __construct(FormBuilderInterface $form_builder) {
    $this->formBuilder = $form_builder;
  }

  /**
   * Displays the SMS providers configuration and test page.
   *
   * @return array
   *   A render array.
   */
  public function configurationPage(): array {
    $build = [];

    // Configuration form.
    $build['configuration'] = [
      '#type' => 'details',
      '#title' => $this->t('SMS Provider Configuration'),
      '#open' => TRUE,
    ];
    $build['configuration']['form'] = $this->formBuilder->getForm(SmsProvidersSettingsForm::class);

    // Test form.
    $build['test'] = [
      '#type' => 'details',
      '#title' => $this->t('Test SMS Sending'),
      '#open' => TRUE,
    ];
    $build['test']['form'] = $this->formBuilder->getForm(SmsTestForm::class);

    return $build;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new static(
      $container->get('form_builder')
    );
  }

}
