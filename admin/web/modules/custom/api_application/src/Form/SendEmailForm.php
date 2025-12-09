<?php

namespace Drupal\api_application\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\api_application\Entity\ApplicationInterface;
use Drupal\api_application\Service\EmailService;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CloseModalDialogCommand;
use Drupal\Core\Ajax\MessageCommand;

/**
 * Form for sending application via email.
 */
class SendEmailForm extends FormBase {

  /**
   * The email service.
   *
   * @var \Drupal\api_application\Service\EmailService
   */
  protected $emailService;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The application entity.
   *
   * @var \Drupal\api_application\Entity\ApplicationInterface
   */
  protected $application;

  /**
   * Constructs a new SendEmailForm.
   *
   * @param \Drupal\api_application\Service\EmailService $email_service
   *   The email service.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   */
  public function __construct(EmailService $email_service, ConfigFactoryInterface $config_factory) {
    $this->emailService = $email_service;
    $this->configFactory = $config_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('api_application.email_service'),
      $container->get('config.factory')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'api_application_send_email_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state, ?ApplicationInterface $application = NULL) {
    $this->application = $application;

    $form['#prefix'] = '<div id="send-email-form-wrapper">';
    $form['#suffix'] = '</div>';

    $form['application_info'] = [
      '#type' => 'item',
      '#title' => $this->t('Application Details'),
      '#markup' => $this->t('<strong>@app_id</strong> - @group_name', [
        '@app_id' => $application->getApplicationId(),
        '@group_name' => $application->getGroupName(),
      ]),
    ];

    $form['email'] = [
      '#type' => 'email',
      '#title' => $this->t('Recipient Email'),
      '#required' => TRUE,
      '#description' => $this->t('Enter the email address where the application PDF should be sent.'),
    ];

    $form['subject'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Email Subject'),
      '#default_value' => $this->t('@site_name - Loan Application @app_id', [
        '@site_name' => $this->configFactory->get('system.site')->get('name') ?: 'Uwezo Fund',
        '@app_id' => $application->getApplicationId(),
      ]),
      '#description' => $this->t('Leave blank to use the default subject.'),
    ];

    $form['message'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Additional Message'),
      '#rows' => 4,
      '#description' => $this->t('Optional additional message to include in the email. Leave blank to use the default template.'),
    ];

    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Send Email'),
      '#ajax' => [
        'callback' => '::ajaxSubmit',
        'wrapper' => 'send-email-form-wrapper',
      ],
    ];

    $form['actions']['cancel'] = [
      '#type' => 'button',
      '#value' => $this->t('Cancel'),
      '#ajax' => [
        'callback' => '::ajaxCancel',
      ],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    $email = $form_state->getValue('email');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      $form_state->setErrorByName('email', $this->t('Please enter a valid email address.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $values = $form_state->getValues();

    // Prepare email options.
    $options = [];
    if (!empty($values['subject'])) {
      $options['subject'] = $values['subject'];
    }
    if (!empty($values['message'])) {
      $options['body'] = $values['message'];
    }

    // Send the email.
    $result = $this->emailService->sendApplicationEmail(
      $this->application,
      $values['email'],
      $options
    );

    if ($result['success']) {
      $this->messenger()->addStatus($this->t('Application sent successfully to @email', [
        '@email' => $values['email'],
      ]));
    }
    else {
      $this->messenger()->addError($this->t('Failed to send email: @message', [
        '@message' => $result['message'],
      ]));
    }
  }

  /**
   * AJAX callback for form submission.
   */
  public function ajaxSubmit(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();

    if ($form_state->hasAnyErrors()) {
      return $response->addCommand(new MessageCommand($form));
    }

    // Close the modal and show success message.
    $response->addCommand(new CloseModalDialogCommand());

    $values = $form_state->getValues();
    $message = $this->t('Application sent successfully to @email', [
      '@email' => $values['email'],
    ]);
    $response->addCommand(new MessageCommand($message, '.region-content', ['type' => 'status']));

    return $response;
  }

  /**
   * AJAX callback for cancel button.
   */
  public function ajaxCancel(array &$form, FormStateInterface $form_state) {
    $response = new AjaxResponse();
    $response->addCommand(new CloseModalDialogCommand());
    return $response;
  }

}
