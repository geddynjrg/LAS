<?php

namespace Drupal\status_manager_notifications\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * Service for managing email templates.
 */
class EmailTemplateService {
  use StringTranslationTrait;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Constructs an EmailTemplateService object.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct(
    ConfigFactoryInterface $config_factory,
    EntityTypeManagerInterface $entity_type_manager,
  ) {
    $this->configFactory = $config_factory;
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * Gets an email template for a specific status change.
   *
   * @param string $entity_type
   *   The entity type ID.
   * @param string $bundle
   *   The entity bundle.
   * @param string $field_name
   *   The status field name.
   * @param string $status
   *   The status value.
   *
   * @return array|null
   *   The template array with 'subject' and 'body' keys, or NULL if not found.
   */
  public function getTemplate($entity_type, $bundle, $field_name, $status) {
    $config = $this->configFactory->get('status_manager_notifications.email_templates');

    // Try to find the most specific template first.
    $template_keys = [
      // Most specific: entity type + bundle + field + status.
      "{$entity_type}.{$bundle}.{$field_name}.{$status}",
      // Entity type + field + status.
      "{$entity_type}.{$field_name}.{$status}",
      // Entity type + status.
      "{$entity_type}.{$status}",
      // Field + status.
      "{$field_name}.{$status}",
      // Just status.
      $status,
    ];

    foreach ($template_keys as $key) {
      $template = $config->get("templates.{$key}");
      if ($template && isset($template['subject']) && isset($template['body'])) {
        return $template;
      }
    }

    // Check for default template.
    $default = $config->get('templates.default');
    if ($default && isset($default['subject']) && isset($default['body'])) {
      return $default;
    }

    return NULL;
  }

  /**
   * Saves an email template.
   *
   * @param string $key
   *   The template key.
   * @param string $subject
   *   The email subject.
   * @param string $body
   *   The email body.
   */
  public function saveTemplate($key, $subject, $body) {
    $config = $this->configFactory->getEditable('status_manager_notifications.email_templates');
    $config->set("templates.{$key}", [
      'subject' => $subject,
      'body' => $body,
    ]);
    $config->save();
  }

  /**
   * Deletes an email template.
   *
   * @param string $key
   *   The template key to delete.
   */
  public function deleteTemplate($key) {
    $config = $this->configFactory->getEditable('status_manager_notifications.email_templates');
    $config->clear("templates.{$key}");
    $config->save();
  }

  /**
   * Gets all available templates.
   *
   * @return array
   *   Array of templates keyed by template key.
   */
  public function getAllTemplates() {
    $config = $this->configFactory->get('status_manager_notifications.email_templates');
    return $config->get('templates') ?: [];
  }

  /**
   * Gets the default email subject for a status change.
   *
   * @param string $entity_type
   *   The entity type ID.
   * @param string $entity_label
   *   The entity label.
   * @param string $new_status
   *   The new status.
   *
   * @return string
   *   The default subject.
   */
  public function getDefaultSubject($entity_type, $entity_label, $new_status) {
    return $this->t('@entity_type Status Update: @label - @status', [
      '@entity_type' => ucfirst(str_replace('_', ' ', $entity_type)),
      '@label' => $entity_label,
      '@status' => ucfirst(str_replace('_', ' ', $new_status)),
    ]);
  }

  /**
   * Gets the default email body for a status change.
   *
   * @param string $entity_type
   *   The entity type ID.
   * @param string $entity_label
   *   The entity label.
   * @param string $old_status
   *   The old status.
   * @param string $new_status
   *   The new status.
   *
   * @return string
   *   The default body.
   */
  public function getDefaultBody($entity_type, $entity_label, $old_status, $new_status) {
    $lines = [];

    $lines[] = $this->t('Hello,');
    $lines[] = '';
    $lines[] = $this->t('The status of @entity_type "@label" has been updated.', [
      '@entity_type' => str_replace('_', ' ', $entity_type),
      '@label' => $entity_label,
    ]);
    $lines[] = '';
    $lines[] = $this->t('Previous status: @old_status', [
      '@old_status' => $old_status ?: $this->t('(none)'),
    ]);
    $lines[] = $this->t('New status: @new_status', [
      '@new_status' => $new_status,
    ]);
    $lines[] = '';
    $lines[] = $this->t('Thank you,');
    $lines[] = $this->t('The @site_name Team', [
      '@site_name' => $this->configFactory->get('system.site')->get('name'),
    ]);

    return implode("\n", $lines);
  }

  /**
   * Validates a template.
   *
   * @param string $subject
   *   The email subject.
   * @param string $body
   *   The email body.
   *
   * @return array
   *   Array of validation errors, empty if valid.
   */
  public function validateTemplate($subject, $body) {
    $errors = [];

    if (empty(trim($subject))) {
      $errors['subject'] = $this->t('Subject cannot be empty.');
    }

    if (empty(trim($body))) {
      $errors['body'] = $this->t('Body cannot be empty.');
    }

    // Check for valid tokens (basic check).
    $invalid_tokens = [];
    preg_match_all('/\[([^\]]+)\]/', $subject . ' ' . $body, $matches);
    foreach ($matches[1] as $token) {
      // Simple validation - tokens should contain a colon.
      if (strpos($token, ':') === FALSE) {
        $invalid_tokens[] = '[' . $token . ']';
      }
    }

    if (!empty($invalid_tokens)) {
      $errors['tokens'] = $this->t('Invalid tokens found: @tokens', [
        '@tokens' => implode(', ', array_unique($invalid_tokens)),
      ]);
    }

    return $errors;
  }

}
