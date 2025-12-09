<?php

namespace Drupal\api_application\Plugin\NotificationProvider\Email;

use Drupal\status_manager_notifications\Plugin\EmailProviderBase;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Drupal\api_application\Service\EmailService;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Mail\MailManagerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a beautifully styled email notification provider for loan applications.
 *
 * @NotificationProvider(
 *   id = "api_application_email",
 *   label = @Translation("Loan Application Email Provider"),
 *   description = @Translation("Sends beautifully styled email notifications for loan application status changes using custom templates."),
 *   type = "email",
 *   weight = 10
 * )
 */
class ApplicationEmailProvider extends EmailProviderBase {

  /**
   * The API application email service.
   *
   * @var \Drupal\api_application\Service\EmailService
   */
  protected $apiEmailService;

  /**
   * Constructs an ApplicationEmailProvider object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory.
   * @param \Drupal\Core\Mail\MailManagerInterface $mail_manager
   *   The mail manager.
   * @param \Drupal\api_application\Service\EmailService $api_email_service
   *   The API application email service.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
    MailManagerInterface $mail_manager,
    EmailService $api_email_service,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $config_factory, $logger_factory, $mail_manager);
    $this->apiEmailService = $api_email_service;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('config.factory'),
      $container->get('logger.factory'),
      $container->get('plugin.manager.mail'),
      $container->get('api_application.email_service')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function isConfigured() {
    return !empty($this->configuration['enabled']);
  }

  /**
   * {@inheritdoc}
   */
  protected function sendTemplatedMessage(StatusChangeInterface $status_change, array $options = []) {
    // Check if this is an application entity.
    $target_entity = $status_change->getTargetEntity();
    if (!$target_entity || $target_entity->getEntityTypeId() !== 'application') {
      return [
        'success' => FALSE,
        'message' => $this->t('This provider only handles loan application entities.'),
      ];
    }

    $recipient = $this->getRecipient($status_change, $options);
    if (!$recipient) {
      return [
        'success' => FALSE,
        'message' => $this->t('No recipient email address found.'),
      ];
    }

    // Check for entity-specific template settings.
    $entity_settings = $options['entity_settings'] ?? [];
    $template_id = NULL;

    if (!empty($entity_settings['email_template'])) {
      $template_id = $entity_settings['email_template'];
    }

    // Get subject and body from template manager or use defaults.
    // $template_manager = \Drupal::service('status_manager_notifications.template_manager');
    // $template = $template_manager->getTemplate('email', $status_change, $template_id);.
    // $subject = $template['subject'] ?? $this->getStatusChangeSubject($status_change, $options);
    // $body = $template['body'] ?? $this->getStatusChangeBody($status_change, $options);.
    $subject = $this->getStatusChangeSubject($status_change, $options);
    $body = $this->getStatusChangeBody($status_change, $options);

    // Prepare email options for status change.
    $email_options = [
      'subject' => $subject,
      'body' => $body,
      // 'from' => $this->getFromEmail(),
      'from' => '<site>',
    ];

    // Add custom data if provided.
    if (!empty($options['additional_data'])) {
      $email_options = array_merge($email_options, $options['additional_data']);
    }

    // Use our custom email service which provides beautiful templates.
    $result = $this->apiEmailService->sendApplicationStatusChangeEmail(
      $target_entity,
      $recipient,
      $status_change,
      $email_options
    );

    if ($result['success']) {
      $this->log('info', 'Status change email sent successfully to @recipient for application @app_id', [
        '@recipient' => $recipient,
        '@app_id' => $target_entity->getApplicationId(),
      ]);
      return [
        'success' => TRUE,
        'message' => $this->t('Status change email sent successfully to @recipient', ['@recipient' => $recipient]),
      ];
    }
    else {
      $this->log('error', 'Failed to send status change email to @recipient for application @app_id: @error', [
        '@recipient' => $recipient,
        '@app_id' => $target_entity->getApplicationId(),
        '@error' => $result['message'],
      ]);
      return [
        'success' => FALSE,
        'message' => $this->t('Failed to send email: @error', ['@error' => $result['message']]),
      ];
    }
  }

  /**
   * {@inheritdoc}
   */
  public function sendCustomMessage($recipient, $message, array $options = []) {
    $subject = $options['subject'] ?? $this->t('Notification from @site', [
      '@site' => $this->configFactory->get('system.site')->get('name'),
    ]);

    // Use our EmailService for consistent styling and functionality.
    $email_options = [
      'from' => $this->getFromEmail(),
    ];

    $result = $this->apiEmailService->sendCustomMessage($recipient, $subject, $message, $email_options);

    // Log the result.
    if ($result['success']) {
      $this->log('info', 'Custom email sent successfully to @recipient', ['@recipient' => $recipient]);
    }
    else {
      $this->log('error', 'Failed to send custom email to @recipient: @error', [
        '@recipient' => $recipient,
        '@error' => $result['message'],
      ]);
    }

    return $result;
  }

  /**
   * Gets the default email subject for a status change when no template is available.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $options
   *   Additional options.
   *
   * @return string
   *   The email subject.
   */
  protected function getStatusChangeSubject(StatusChangeInterface $status_change, array $options = []) {
    if (!empty($options['subject'])) {
      return $options['subject'];
    }

    $target_entity = $status_change->getTargetEntity();
    $new_status = ucfirst(str_replace('_', ' ', $status_change->getNewStatus()));
    $site_name = $this->configFactory->get('system.site')->get('name');

    return $this->t('Your Loan Application @app_id is @status', [
      '@app_id' => $target_entity->getApplicationId(),
      '@status' => $new_status,
    // '@site' => $site_name,
    ]);
  }

  /**
   * Gets the default email body for a status change when no template is available.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $options
   *   Additional options.
   *
   * @return string
   *   The email body.
   */
  protected function getStatusChangeBody(StatusChangeInterface $status_change, array $options = []) {
    if (!empty($options['body'])) {
      return $options['body'];
    }

    $target_entity = $status_change->getTargetEntity();
    $new_status = ucfirst(str_replace('_', ' ', $status_change->getNewStatus()));

    // Create a personalized message based on status.
    $status_messages = [
      'draft' => 'Your loan application is currently in draft status. Please complete and submit it when ready.',
      'pending' => 'Your loan application has been received and is pending review.',
      'submitted' => 'Your loan application has been successfully submitted and is now under review.',
      'under_review' => 'Your loan application is currently being reviewed by our team.',
      'approved' => 'Congratulations! Your loan application has been approved. We will contact you with next steps.',
      'rejected' => 'We regret to inform you that your loan application has not been approved at this time.',
      'disbursed' => 'Your loan has been successfully disbursed. Please check your account.',
      'closed' => 'Your loan application has been closed.',
    ];

    $status_key = $status_change->getNewStatus();
    $default_message = "Your loan application status has been updated to: {$new_status}.";

    return $status_messages[$status_key] ?? $default_message;
  }

  /**
   * {@inheritdoc}
   */
  protected function getRecipient(StatusChangeInterface $status_change, array $options = []) {
    // Check if email is provided in options.
    if (!empty($options['recipient'])) {
      return $options['recipient'];
    }

    $target_entity = $status_change->getTargetEntity();
    if ($target_entity && $target_entity->getEntityTypeId() === 'application') {
      // For applications, get email from the entity owner (the applicant).
      $owner = $target_entity->getOwner();
      if ($owner) {
        return $owner->getEmail();
      }
    }

    // Fallback to parent implementation.
    return parent::getRecipient($status_change, $options);
  }

}
