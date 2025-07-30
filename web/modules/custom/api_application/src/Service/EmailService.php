<?php

namespace Drupal\api_application\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\api_application\Entity\ApplicationInterface;
use Drupal\symfony_mailer\EmailFactoryInterface;

/**
 * Service for sending application emails.
 */
class EmailService {

  use StringTranslationTrait;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The email factory service.
   *
   * @var \Drupal\symfony_mailer\EmailFactoryInterface
   */
  protected $emailFactory;

  /**
   * The renderer service.
   *
   * @var \Drupal\Core\Render\RendererInterface
   */
  protected $renderer;

  /**
   * The logger service.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * The file system service.
   *
   * @var \Drupal\Core\File\FileSystemInterface
   */
  protected $fileSystem;

  /**
   * The PDF generator service.
   *
   * @var \Drupal\api_application\Service\PdfGeneratorService
   */
  protected $pdfGenerator;

  /**
   * Constructs a new EmailService.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\symfony_mailer\EmailFactoryInterface $email_factory
   *   The email factory.
   * @param \Drupal\Core\Render\RendererInterface $renderer
   *   The renderer service.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $logger_factory
   *   The logger factory service.
   * @param \Drupal\Core\File\FileSystemInterface $file_system
   *   The file system service.
   * @param \Drupal\api_application\Service\PdfGeneratorService $pdf_generator
   *   The PDF generator service.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    EmailFactoryInterface $email_factory,
    RendererInterface $renderer,
    LoggerChannelFactoryInterface $logger_factory,
    FileSystemInterface $file_system,
    PdfGeneratorService $pdf_generator,
  ) {
    $this->configFactory = $config_factory;
    $this->emailFactory = $email_factory;
    $this->renderer = $renderer;
    $this->logger = $logger_factory->get('api_application');
    $this->fileSystem = $file_system;
    $this->pdfGenerator = $pdf_generator;
  }

  /**
   * Sends an application via email.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   * @param string $recipient_email
   *   The recipient email address.
   * @param array $options
   *   Additional options for email sending.
   *
   * @return array
   *   Result array with success status and message.
   */
  public function sendApplicationEmail(ApplicationInterface $application, $recipient_email, array $options = []) {
    try {
      // Validate email address.
      if (!filter_var($recipient_email, FILTER_VALIDATE_EMAIL)) {
        return [
          'success' => FALSE,
          'message' => 'Invalid email address provided',
        ];
      }

      // Generate PDF first.
      $pdf_path = $this->pdfGenerator->generateApplicationPdf($application);

      if (!file_exists($pdf_path)) {
        return [
          'success' => FALSE,
          'message' => 'Failed to generate PDF for application',
        ];
      }

      // Get sender email.
      $from_email = $options['from'] ?? '<site>';

      // Create email using Symfony Mailer with EmailBuilder.
      $site_name = $this->configFactory->get('system.site')->get('name') ?: 'Uwezo Fund';
      $email = $this->emailFactory->newTypedEmail('api_application', 'send_application', $application, $site_name);

      // Set recipients.
      $email->setTo($recipient_email);
      $email->setFrom($from_email);

      // Set subject if provided, otherwise EmailBuilder will handle default.
      if (!empty($options['subject'])) {
        $email->setSubject($options['subject']);
      }
      else {
        $email->setSubject($this->getDefaultSubject($application));
      }

      // Attach PDF file.
      $attachment_filename = 'application-' . $application->getApplicationId() . '.pdf';
      $email->attachFromPath($pdf_path, $attachment_filename, 'application/pdf');

      // Send the email.
      $email->send();

      $this->logger->info('Application @app_id sent successfully to @email using Symfony Mailer', [
        '@app_id' => $application->getApplicationId(),
        '@email' => $recipient_email,
      ]);

      return [
        'success' => TRUE,
        'message' => 'Application sent successfully',
      ];

    }
    catch (\Exception $e) {
      $this->logger->error('Email sending failed: @message', [
        '@message' => $e->getMessage(),
      ]);

      return [
        'success' => FALSE,
        'message' => 'An error occurred while sending the email: ' . $e->getMessage(),
      ];
    }
  }

  /**
   * Gets the default email subject.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return string
   *   The default subject.
   */
  protected function getDefaultSubject(ApplicationInterface $application) {
    $site_name = $this->configFactory->get('system.site')->get('name') ?: 'Uwezo Fund';
    return $this->t('@site_name - Loan Application @app_id', [
      '@site_name' => $site_name,
      '@app_id' => $application->getApplicationId(),
    ]);
  }

  /**
   * Gets the default email body.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   *
   * @return string
   *   The default body.
   */
  protected function getDefaultBody(ApplicationInterface $application) {
    // Use the email template for HTML content.
    $site_name = $this->configFactory->get('system.site')->get('name') ?: 'Uwezo Fund';

    $build = [
      '#theme' => 'application_email',
      '#application' => $application,
      '#site_name' => $site_name,
    ];

    // Render the email template.
    $html = $this->renderer->renderPlain($build);

    return $html;
  }

  /**
   * Sends a status change notification email for an application.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   * @param string $recipient_email
   *   The recipient email address.
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $options
   *   Optional email options:
   *   - subject: Custom email subject.
   *   - body: Custom email body.
   *   - from: Sender email address.
   *   - include_pdf: Whether to include PDF attachment (default: false).
   *
   * @return array
   *   An array with 'success' (bool) and 'message' (string) keys.
   */
  public function sendApplicationStatusChangeEmail(ApplicationInterface $application, $recipient_email, $status_change, array $options = []) {
    try {
      // Validate email address.
      if (!filter_var($recipient_email, FILTER_VALIDATE_EMAIL)) {
        return [
          'success' => FALSE,
          'message' => 'Invalid email address provided',
        ];
      }

      // Get sender email.
      $from_email = $options['from'] ?? '<site>';

      // Create email using Symfony Mailer with proper type.
      $site_name = $this->configFactory->get('system.site')->get('name') ?: 'Uwezo Fund';
      $email = $this->emailFactory->newTypedEmail('api_application', 'status_change', $application, $status_change, $site_name);

      // Set basic email properties.
      $email->setFrom($from_email);
      $email->setTo($recipient_email);

      // Set subject - either custom or default.
      $subject = $options['subject'] ?? $this->getDefaultStatusChangeSubject($application, $status_change);
      $email->setSubject($subject);

      // Optionally include PDF attachment.
      if (!empty($options['include_pdf'])) {
        $pdf_path = $this->pdfGenerator->generateApplicationPdf($application);
        if (file_exists($pdf_path)) {
          $attachment_filename = 'application-' . $application->getApplicationId() . '.pdf';
          $email->attachFromPath($pdf_path, $attachment_filename, 'application/pdf');
        }
      }

      // Send the email.
      $result = $email->send();

      if ($result) {
        $this->logger->info('Status change email sent successfully to @email for application @app_id (status: @status)', [
          '@email' => $recipient_email,
          '@app_id' => $application->getApplicationId(),
          '@status' => $status_change->getNewStatus(),
        ]);

        return [
          'success' => TRUE,
          'message' => 'Status change email sent successfully',
        ];
      }
      else {
        $this->logger->error('Failed to send status change email to @email for application @app_id', [
          '@email' => $recipient_email,
          '@app_id' => $application->getApplicationId(),
        ]);

        return [
          'success' => FALSE,
          'message' => 'Failed to send status change email',
        ];
      }

    }
    catch (\Exception $e) {
      $this->logger->error('Exception while sending status change email: @message', [
        '@message' => $e->getMessage(),
      ]);

      return [
        'success' => FALSE,
        'message' => 'An error occurred while sending the status change email: ' . $e->getMessage(),
      ];
    }
  }

  /**
   * Gets the default subject for status change emails.
   *
   * @param \Drupal\api_application\Entity\ApplicationInterface $application
   *   The application entity.
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   *
   * @return string
   *   The email subject.
   */
  protected function getDefaultStatusChangeSubject(ApplicationInterface $application, $status_change) {
    $site_name = $this->configFactory->get('system.site')->get('name');
    $status = ucfirst(str_replace('_', ' ', $status_change->getNewStatus()));

    return $this->t('Your Loan Application @app_id has been @status - @site', [
      '@app_id' => $application->getApplicationId(),
      '@status' => $status,
      '@site' => $site_name,
    ]);
  }

  /**
   * Sends a simple custom message email with consistent styling.
   *
   * @param string $recipient_email
   *   The recipient email address.
   * @param string $subject
   *   The email subject.
   * @param string $message
   *   The email message content.
   * @param array $options
   *   Optional email options:
   *   - from: Sender email address.
   *
   * @return array
   *   An array with 'success' (bool) and 'message' (string) keys.
   */
  public function sendCustomMessage($recipient_email, $subject, $message, array $options = []) {
    try {
      // Validate email address.
      if (!filter_var($recipient_email, FILTER_VALIDATE_EMAIL)) {
        return [
          'success' => FALSE,
          'message' => 'Invalid email address provided',
        ];
      }

      // Get sender email.
      $from_email = $options['from'] ?? '<site>';

      // Get site name.
      $site_name = $this->configFactory->get('system.site')->get('name') ?: 'Uwezo Fund';

      // Create email using Symfony Mailer with proper type.
      $email = $this->emailFactory->newTypedEmail('api_application', 'custom_message', $message, $site_name);

      // Set basic email properties.
      $email->setFrom($from_email);
      $email->setTo($recipient_email);
      $email->setSubject($subject);

      // Send the email.
      $result = $email->send();

      if ($result) {
        $this->logger->info('Custom message email sent successfully to @email', [
          '@email' => $recipient_email,
        ]);

        return [
          'success' => TRUE,
          'message' => 'Custom message email sent successfully',
        ];
      }
      else {
        $this->logger->error('Failed to send custom message email to @email', [
          '@email' => $recipient_email,
        ]);

        return [
          'success' => FALSE,
          'message' => 'Failed to send custom message email',
        ];
      }

    }
    catch (\Exception $e) {
      $this->logger->error('Exception while sending custom message email: @message', [
        '@message' => $e->getMessage(),
      ]);

      return [
        'success' => FALSE,
        'message' => 'An error occurred while sending the custom message email: ' . $e->getMessage(),
      ];
    }
  }

}
