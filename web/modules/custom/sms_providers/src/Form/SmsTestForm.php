<?php

namespace Drupal\sms_providers\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Logger\LoggerChannelInterface;
use Drupal\sms_providers\Service\PhoneNumberValidationService;
use Drupal\sms_providers\Service\SmsService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for testing SMS message sending.
 */
class SmsTestForm extends FormBase {

  /**
   * The logger channel.
   */
  protected LoggerChannelInterface $logger;

  /**
   * The phone number validation service.
   */
  protected PhoneNumberValidationService $phoneValidation;

  /**
   * The SMS service.
   */
  protected SmsService $smsService;

  /**
   * Constructs a SmsTestForm object.
   *
   * @param \Drupal\sms_providers\Service\SmsService $sms_service
   *   The SMS service.
   * @param \Drupal\Core\Logger\LoggerChannelInterface $logger
   *   The logger channel.
   * @param \Drupal\sms_providers\Service\PhoneNumberValidationService $phone_validation
   *   The phone number validation service.
   */
  public function __construct(
    SmsService $sms_service,
    LoggerChannelInterface $logger,
    PhoneNumberValidationService $phone_validation,
  ) {
    $this->smsService = $sms_service;
    $this->logger = $logger;
    $this->phoneValidation = $phone_validation;
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    if (!$this->smsService->isConfigured()) {
      $form['no_provider'] = [
        '#markup' => '<div class="messages messages--warning">' . $this->t('No SMS provider is configured. Please configure a provider before testing.') . '</div>',
      ];

      return $form;
    }

    $form['phone'] = [
      '#type' => 'tel',
      '#title' => $this->t('Phone Number'),
      '#description' => $this->t('Enter a phone number to send the test message to (e.g., +254712345678).'),
      '#placeholder' => '+254712345678',
      '#required' => TRUE,
    ];

    $form['message'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Test Message'),
      '#description' => $this->t('Enter the test message content.'),
      '#default_value' => 'This is a test message from the SMS provider.',
      '#rows' => 3,
      '#maxlength' => 160,
      '#required' => TRUE,
    ];

    $default_provider = $this->smsService->getDefaultProvider();

    if ($default_provider) {
      $form['provider_info'] = [
        '#markup' => '<p>' . $this->t('Test message will be sent using: <strong>@provider</strong>', [
          '@provider' => $default_provider->getName(),
        ]) . '</p>',
      ];
    }

    $form['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Send Test Message'),
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new static(
      $container->get('sms_providers.sms_service'),
      $container->get('sms_providers.logger'),
      $container->get('sms_providers.phone_validation')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'sms_test_form';
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $phone = $form_state->getValue('phone');
    $message = $form_state->getValue('message');

    try {
      $result = $this->smsService->sendSms($phone, $message);

      if ($result['success']) {
        $this->messenger()->addStatus($this->t('Test message sent successfully! Message ID: @id', [
          '@id' => $result['message_id'],
        ]));
      }
      else {
        $this->messenger()->addError($this->t('Failed to send test message: @error', [
          '@error' => $result['message'],
        ]));
      }
    }
    catch (\Exception $e) {
      $this->messenger()->addError($this->t('Failed to send test message: @error', [
        '@error' => $e->getMessage(),
      ]));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    $phone = $form_state->getValue('phone');

    if (!empty($phone)) {
      $validation_result = $this->phoneValidation->validate($phone);

      if (!$validation_result['valid']) {
        $form_state->setErrorByName('phone', implode(' ', $validation_result['violations']));
      }
    }

    parent::validateForm($form, $form_state);
  }

}
