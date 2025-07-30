<?php

namespace Drupal\api_application\Plugin\EmailBuilder;

use Drupal\api_application\Entity\ApplicationInterface;
use Drupal\symfony_mailer\Processor\EmailBuilderBase;
use Drupal\symfony_mailer\EmailInterface;

/**
 * Defines the Email Builder plug-in for application emails.
 *
 * @EmailBuilder(
 *   id = "api_application",
 *   sub_types = {
 *     "send_application" = @Translation("Send Application"),
 *     "status_change" = @Translation("Status Change Notification"),
 *     "custom_message" = @Translation("Custom Message"),
 *   },
 *   common_adjusters = {"email_subject", "email_body", "email_to"},
 * )
 */
class ApplicationEmailBuilder extends EmailBuilderBase {

  /**
   * Saves the parameters for a newly created email.
   *
   * @param \Drupal\symfony_mailer\EmailInterface $email
   *   The email to modify.
   * @param mixed ...$params
   *   Additional parameters.
   */
  public function createParams(EmailInterface $email, ...$params) {
    $sub_type = $email->getSubType();

    switch ($sub_type) {
      case 'send_application':
        // Parameters: application, site_name.
        $application = $params[0] ?? NULL;
        $site_name = $params[1] ?? NULL;

        if ($application instanceof ApplicationInterface) {
          $email->setParam('application', $application);
        }
        if ($site_name) {
          $email->setParam('site_name', $site_name);
        }
        break;

      case 'status_change':
        // Parameters: application, status_change, site_name.
        $application = $params[0] ?? NULL;
        $status_change = $params[1] ?? NULL;
        $site_name = $params[2] ?? NULL;

        if ($application instanceof ApplicationInterface) {
          $email->setParam('application', $application);
        }
        if ($status_change) {
          $email->setParam('status_change', $status_change);
        }
        if ($site_name) {
          $email->setParam('site_name', $site_name);
        }
        break;

      case 'custom_message':
        // Parameters: message, site_name.
        $message = $params[0] ?? NULL;
        $site_name = $params[1] ?? NULL;

        if ($message) {
          $email->setParam('message', $message);
        }
        if ($site_name) {
          $email->setParam('site_name', $site_name);
        }
        break;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function build(EmailInterface $email) {
    $sub_type = $email->getSubType();

    switch ($sub_type) {
      case 'send_application':
        $this->buildSendApplicationEmail($email);
        break;

      case 'status_change':
        $this->buildStatusChangeEmail($email);
        break;

      case 'custom_message':
        $this->buildCustomMessageEmail($email);
        break;
    }
  }

  /**
   * Builds the send application email.
   */
  protected function buildSendApplicationEmail(EmailInterface $email) {
    $application = $email->getParam('application');
    $site_name = $email->getParam('site_name');

    // Set variables for template.
    $email->setVariable('application', $application);
    $email->setVariable('site_name', $site_name);

    // Use the custom email template render array.
    $email->setBody([
      '#theme' => 'application_email',
      '#application' => $application,
      '#site_name' => $site_name,
    ]);
  }

  /**
   * Builds the status change notification email.
   */
  protected function buildStatusChangeEmail(EmailInterface $email) {
    $application = $email->getParam('application');
    $status_change = $email->getParam('status_change');
    $site_name = $email->getParam('site_name');

    // Set variables for template.
    $email->setVariable('application', $application);
    $email->setVariable('status_change', $status_change);
    $email->setVariable('site_name', $site_name);

    // Use the status change email template.
    $email->setBody([
      '#theme' => 'application_status_change_email',
      '#application' => $application,
      '#status_change' => $status_change,
      '#site_name' => $site_name,
    ]);
  }

  /**
   * Builds the custom message email.
   */
  protected function buildCustomMessageEmail(EmailInterface $email) {
    $message = $email->getParam('message');
    $site_name = $email->getParam('site_name');

    // Set variables for template.
    $email->setVariable('message', $message);
    $email->setVariable('site_name', $site_name);

    // Use the custom message email template.
    $email->setBody([
      '#theme' => 'application_custom_message_email',
      '#message' => $message,
      '#site_name' => $site_name,
    ]);
  }

}
