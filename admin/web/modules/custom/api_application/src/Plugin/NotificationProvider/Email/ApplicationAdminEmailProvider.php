<?php

namespace Drupal\api_application\Plugin\NotificationProvider\Email;

use Drupal\status_manager_notifications\Plugin\EmailProviderBase;
use Drupal\status_manager\Entity\StatusChangeInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\Core\Mail\MailManagerInterface;
use Drupal\symfony_mailer\EmailFactoryInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides email notifications to admin users based on roles.
 *
 * @NotificationProvider(
 *   id = "application_admin_email",
 *   label = @Translation("Application Admin Email Provider"),
 *   description = @Translation("Sends email notifications to admin users based on their roles for action requests."),
 *   type = "email",
 *   weight = 15
 * )
 */
class ApplicationAdminEmailProvider extends EmailProviderBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The email factory service.
   *
   * @var \Drupal\symfony_mailer\EmailFactoryInterface
   */
  protected $emailFactory;

  /**
   * Constructs an ApplicationAdminEmailProvider object.
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
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\symfony_mailer\EmailFactoryInterface $email_factory
   *   The email factory.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    ConfigFactoryInterface $config_factory,
    LoggerChannelFactoryInterface $logger_factory,
    MailManagerInterface $mail_manager,
    EntityTypeManagerInterface $entity_type_manager,
    EmailFactoryInterface $email_factory,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $config_factory, $logger_factory, $mail_manager);
    $this->entityTypeManager = $entity_type_manager;
    $this->emailFactory = $email_factory;
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
      $container->get('entity_type.manager'),
      $container->get('email_factory')
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
    $target_entity = $status_change->getTargetEntity();

    // Only handle application entities.
    if (!$target_entity || $target_entity->getEntityTypeId() !== 'application') {
      return [
        'success' => FALSE,
        'message' => $this->t('This provider only handles application entities.'),
      ];
    }

    // Get recipients based on roles.
    $recipients = $this->getRoleBasedRecipients($status_change, $options);

    if (empty($recipients)) {
      return [
        'success' => FALSE,
        'message' => $this->t('No admin recipients found for the specified roles.'),
      ];
    }

    // Track results for each recipient.
    $results = [];
    $all_success = TRUE;

    // Get site name.
    $site_name = $this->configFactory->get('system.site')->get('name') ?: 'Uwezo Fund';

    foreach ($recipients as $recipient_email => $recipient_name) {
      try {
        // Create email using Symfony Mailer with parameters.
        // Parameters are passed to createParams() method in EmailBuilder.
        $email = $this->emailFactory->newTypedEmail('api_application', 'admin_action_request',
          $target_entity, $status_change, $site_name, $recipient_name, $recipient_email);

        // Set recipient.
        $email->setTo($recipient_email);

        // Send the email.
        $email->send();

        $this->log('info', 'Admin email sent successfully to @recipient', ['@recipient' => $recipient_email]);
        $results[$recipient_email] = [
          'success' => TRUE,
          'message' => $this->t('Email sent successfully to @recipient', ['@recipient' => $recipient_email]),
        ];
      }
      catch (\Exception $e) {
        $all_success = FALSE;
        $this->log('error', 'Failed to send admin email to @recipient: @error', [
          '@recipient' => $recipient_email,
          '@error' => $e->getMessage(),
        ]);
        $results[$recipient_email] = [
          'success' => FALSE,
          'message' => $this->t('Failed to send email to @recipient: @error', [
            '@recipient' => $recipient_email,
            '@error' => $e->getMessage(),
          ]),
        ];
      }
    }

    return [
      'success' => $all_success,
      'message' => $all_success ?
      $this->t('Admin emails sent successfully to @count recipients', ['@count' => count($recipients)]) :
      $this->t('Some admin emails failed to send'),
      'details' => $results,
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function sendCustomMessage($recipient, $message, array $options = []) {
    try {
      $site_name = $this->configFactory->get('system.site')->get('name') ?: 'Uwezo Fund';
      $subject = $options['subject'] ?? $this->t('Admin Action Required - @site', ['@site' => $site_name]);

      // Create email using Symfony Mailer with parameters.
      // Parameters are passed to createParams() method in EmailBuilder.
      $email = $this->emailFactory->newTypedEmail('api_application', 'admin_custom_message',
        $message, $site_name, $subject, $recipient);

      // Set recipient and subject.
      $email->setTo($recipient);
      $email->setSubject($subject);

      // Send the email.
      $email->send();

      $this->log('info', 'Custom admin email sent successfully to @recipient', ['@recipient' => $recipient]);
      return [
        'success' => TRUE,
        'message' => $this->t('Email sent successfully to @recipient', ['@recipient' => $recipient]),
      ];
    }
    catch (\Exception $e) {
      $this->log('error', 'Failed to send custom admin email to @recipient: @error', [
        '@recipient' => $recipient,
        '@error' => $e->getMessage(),
      ]);
      return [
        'success' => FALSE,
        'message' => $this->t('Failed to send email: @error', ['@error' => $e->getMessage()]),
      ];
    }
  }

  /**
   * Get recipients based on roles.
   *
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   * @param array $options
   *   Additional options containing role information.
   *
   * @return array
   *   Array of recipient emails keyed by email with display name as value.
   */
  protected function getRoleBasedRecipients(StatusChangeInterface $status_change, array $options = []) {
    $recipients = [];

    // Get roles from options or configuration.
    $roles = $options['roles'] ?? [];

    // If no roles specified, check status-specific configuration.
    if (empty($roles)) {
      $status_config = $this->configFactory->get('status_manager_notifications.status_routing');
      $entity_type = $status_change->getTargetEntity()->getEntityTypeId();
      $status_field = $status_change->getStatusField();
      $new_status = $status_change->getNewStatus();

      $routing_key = "{$entity_type}.{$status_field}.{$new_status}";
      $routing = $status_config->get($routing_key);

      if (!empty($routing['admin_roles'])) {
        $roles = $routing['admin_roles'];
      }
    }

    // Default to 'administrator' role if none specified.
    if (empty($roles)) {
      $roles = ['administrator'];
    }

    // Load users with specified roles.
    try {
      $user_storage = $this->entityTypeManager->getStorage('user');

      // Query users by role.
      $query = $user_storage->getQuery()
        ->condition('status', 1)
        ->condition('roles', $roles, 'IN')
        ->accessCheck(FALSE);

      $user_ids = $query->execute();

      if (!empty($user_ids)) {
        $users = $user_storage->loadMultiple($user_ids);

        foreach ($users as $user) {
          /** @var \Drupal\user\UserInterface $user */
          if ($user->getEmail()) {
            $display_name = $user->getDisplayName() ?: $user->getAccountName();
            $recipients[$user->getEmail()] = $display_name;
          }
        }
      }
    }
    catch (\Exception $e) {
      $this->log('error', 'Error loading users for role-based notifications: @error', ['@error' => $e->getMessage()]);
    }

    return $recipients;
  }

  /**
   * {@inheritdoc}
   */
  protected function getRecipient(StatusChangeInterface $status_change, array $options = []) {
    // This provider uses getRoleBasedRecipients instead.
    // Return NULL to indicate this method is not used.
    return NULL;
  }

}
