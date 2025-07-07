<?php

namespace Drupal\status_manager_notifications\Service;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * Service for managing SMS templates.
 */
class SmsTemplateService {
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
   * Constructs an SmsTemplateService object.
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
   * Gets an SMS template for a specific status change.
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
   *   The template array with 'message' key, or NULL if not found.
   */
  public function getTemplate($entity_type, $bundle, $field_name, $status) {
    $config = $this->configFactory->get('status_manager_notifications.sms_templates');

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
      if ($template && isset($template['message'])) {
        return $template;
      }
    }

    // Check for default template.
    $default = $config->get('templates.default');
    if ($default && isset($default['message'])) {
      return $default;
    }

    return NULL;
  }

  /**
   * Saves an SMS template.
   *
   * @param string $key
   *   The template key.
   * @param string $message
   *   The SMS message.
   */
  public function saveTemplate($key, $message) {
    $config = $this->configFactory->getEditable('status_manager_notifications.sms_templates');
    $config->set("templates.{$key}", [
      'message' => $message,
    ]);
    $config->save();
  }

  /**
   * Deletes an SMS template.
   *
   * @param string $key
   *   The template key to delete.
   */
  public function deleteTemplate($key) {
    $config = $this->configFactory->getEditable('status_manager_notifications.sms_templates');
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
    $config = $this->configFactory->get('status_manager_notifications.sms_templates');
    return $config->get('templates') ?: [];
  }

  /**
   * Gets the default SMS message for a status change.
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
   *   The default message.
   */
  public function getDefaultMessage($entity_type, $entity_label, $old_status, $new_status) {
    return $this->t('@entity_type "@label" status changed from @old to @new.', [
      '@entity_type' => ucfirst(str_replace('_', ' ', $entity_type)),
      '@label' => $entity_label,
      '@old' => $old_status ?: $this->t('(none)'),
      '@new' => $new_status,
    ]);
  }

  /**
   * Validates an SMS template.
   *
   * @param string $message
   *   The SMS message.
   *
   * @return array
   *   Array of validation errors, empty if valid.
   */
  public function validateTemplate($message) {
    $errors = [];

    if (empty(trim($message))) {
      $errors['message'] = $this->t('Message cannot be empty.');
    }

    // Check message length (standard SMS is 160 characters).
    $length = mb_strlen($message);
    if ($length > 1600) {
      $errors['message_length'] = $this->t('Message is too long (@length characters). Maximum allowed is 1600 characters (10 SMS segments).', [
        '@length' => $length,
      ]);
    }
    elseif ($length > 160) {
      // This is a warning, not an error.
      // Multi-part SMS uses 153 chars per segment.
      $segments = ceil($length / 153);
      $errors['message_warning'] = $this->t('Message will be sent as @segments SMS segments (@length characters).', [
        '@segments' => $segments,
        '@length' => $length,
      ]);
    }

    // Check for valid tokens (basic check).
    $invalid_tokens = [];
    preg_match_all('/\[([^\]]+)\]/', $message, $matches);
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

  /**
   * Truncates a message to fit SMS limits.
   *
   * @param string $message
   *   The message to truncate.
   * @param int $max_length
   *   Maximum length (default 160 for single SMS).
   * @param string $suffix
   *   Suffix to add when truncating (default '...').
   *
   * @return string
   *   The truncated message.
   */
  public function truncateMessage($message, $max_length = 160, $suffix = '...') {
    if (mb_strlen($message) <= $max_length) {
      return $message;
    }

    $suffix_length = mb_strlen($suffix);
    $truncate_length = $max_length - $suffix_length;

    return mb_substr($message, 0, $truncate_length) . $suffix;
  }

}
