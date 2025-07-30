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
    // Extract parameters: first is application, second is site_name.
    $application = $params[0] ?? NULL;
    $site_name = $params[1] ?? NULL;

    if ($application instanceof ApplicationInterface) {
      $email->setParam('application', $application);
    }
    if ($site_name) {
      $email->setParam('site_name', $site_name);
    }
  }

  /**
   * {@inheritdoc}
   */
  public function build(EmailInterface $email) {
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

}
