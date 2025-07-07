<?php

namespace Drupal\status_manager_notifications\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Utility\Token;
use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;

/**
 * Service for replacing tokens in notification templates.
 */
class TokenReplacementService {

  use StringTranslationTrait;

  /**
   * The token service.
   *
   * @var \Drupal\Core\Utility\Token
   */
  protected $token;

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The date formatter.
   *
   * @var \Drupal\Core\Datetime\DateFormatterInterface
   */
  protected $dateFormatter;

  /**
   * Constructs a TokenReplacementService object.
   *
   * @param \Drupal\Core\Utility\Token $token
   *   The token service.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   * @param \Drupal\Core\Datetime\DateFormatterInterface $date_formatter
   *   The date formatter.
   */
  public function __construct(
    Token $token,
    EntityTypeManagerInterface $entity_type_manager,
    DateFormatterInterface $date_formatter,
  ) {
    $this->token = $token;
    $this->entityTypeManager = $entity_type_manager;
    $this->dateFormatter = $date_formatter;
  }

  /**
   * Replaces tokens in a string.
   *
   * @param string $text
   *   The text containing tokens.
   * @param array $data
   *   The data for token replacement.
   * @param array $options
   *   Additional options for token replacement.
   *
   * @return string
   *   The text with tokens replaced.
   */
  public function replace($text, array $data = [], array $options = []) {
    // First, use Drupal's token service for standard tokens.
    $text = $this->token->replace($text, $data, $options);

    // Then handle our custom tokens.
    if (!empty($data['status_change'])) {
      $text = $this->replaceStatusChangeTokens($text, $data['status_change']);
    }

    if (!empty($data['target_entity'])) {
      $text = $this->replaceTargetEntityTokens($text, $data['target_entity']);
    }

    return $text;
  }

  /**
   * Replaces status change specific tokens.
   *
   * @param string $text
   *   The text containing tokens.
   * @param \Drupal\status_manager\Entity\StatusChangeInterface $status_change
   *   The status change entity.
   *
   * @return string
   *   The text with tokens replaced.
   */
  protected function replaceStatusChangeTokens($text, $status_change) {
    $replacements = [];

    // Basic status change tokens.
    $replacements['[status_change:id]'] = $status_change->id();
    $replacements['[status_change:entity-type]'] = $status_change->getTargetEntityType();
    $replacements['[status_change:entity-id]'] = $status_change->getTargetEntityId();
    $replacements['[status_change:field]'] = $status_change->getStatusField();
    $replacements['[status_change:old-status]'] = $status_change->getOldStatus() ?: $this->t('(none)');
    $replacements['[status_change:new-status]'] = $status_change->getNewStatus();
    $replacements['[status_change:source]'] = $status_change->getSource();
    $replacements['[status_change:notes]'] = $status_change->getNotes() ?: $this->t('(no notes)');

    // Format the creation date.
    $created_time = $status_change->getCreatedTime();
    $replacements['[status_change:created]'] = $this->dateFormatter->format($created_time, 'medium');
    $replacements['[status_change:created:short]'] = $this->dateFormatter->format($created_time, 'short');
    $replacements['[status_change:created:long]'] = $this->dateFormatter->format($created_time, 'long');

    // User information.
    $user = $status_change->getOwner();
    if ($user) {
      $replacements['[status_change:user]'] = $user->getDisplayName();
      $replacements['[status_change:user:mail]'] = $user->getEmail();
      $replacements['[status_change:user:uid]'] = $user->id();
    }

    // Target entity information.
    $target_entity = $status_change->getTargetEntity();
    if ($target_entity) {
      $replacements['[status_change:entity-label]'] = $target_entity->label();

      // Add URL if entity has canonical link.
      if ($target_entity->hasLinkTemplate('canonical')) {
        try {
          $url = $target_entity->toUrl('canonical', ['absolute' => TRUE]);
          $replacements['[status_change:entity-url]'] = $url->toString();
        }
        catch (\Exception $e) {
          $replacements['[status_change:entity-url]'] = '';
        }
      }
    }

    // Human-readable status values.
    $replacements['[status_change:old-status:human]'] = $this->humanizeStatus($status_change->getOldStatus());
    $replacements['[status_change:new-status:human]'] = $this->humanizeStatus($status_change->getNewStatus());

    return strtr($text, $replacements);
  }

  /**
   * Replaces target entity specific tokens.
   *
   * @param string $text
   *   The text containing tokens.
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The target entity.
   *
   * @return string
   *   The text with tokens replaced.
   */
  protected function replaceTargetEntityTokens($text, $entity) {
    $replacements = [];

    // Basic entity information.
    $replacements['[target_entity:id]'] = $entity->id();
    $replacements['[target_entity:label]'] = $entity->label();
    $replacements['[target_entity:type]'] = $entity->getEntityTypeId();
    $replacements['[target_entity:bundle]'] = $entity->bundle();

    // Entity URL.
    if ($entity->hasLinkTemplate('canonical')) {
      try {
        $url = $entity->toUrl('canonical', ['absolute' => TRUE]);
        $replacements['[target_entity:url]'] = $url->toString();
      }
      catch (\Exception $e) {
        $replacements['[target_entity:url]'] = '';
      }
    }

    // Common fields.
    $common_fields = [
      'created' => 'date',
      'changed' => 'date',
      'title' => 'string',
      'name' => 'string',
      'mail' => 'string',
      'email' => 'string',
      'phone' => 'string',
      'status' => 'string',
    ];

    foreach ($common_fields as $field_name => $field_type) {
      if ($entity->hasField($field_name) && !$entity->get($field_name)->isEmpty()) {
        $value = $entity->get($field_name)->value;

        if ($field_type === 'date' && is_numeric($value)) {
          $replacements["[target_entity:{$field_name}]"] = $this->dateFormatter->format($value, 'medium');
          $replacements["[target_entity:{$field_name}:short]"] = $this->dateFormatter->format($value, 'short');
          $replacements["[target_entity:{$field_name}:long]"] = $this->dateFormatter->format($value, 'long');
        }
        else {
          $replacements["[target_entity:{$field_name}]"] = $value;
        }
      }
    }

    // Handle field_* tokens dynamically.
    preg_match_all('/\[target_entity:(field_[^\]]+)\]/', $text, $matches);
    if (!empty($matches[1])) {
      foreach ($matches[1] as $field_name) {
        if ($entity->hasField($field_name) && !$entity->get($field_name)->isEmpty()) {
          $field = $entity->get($field_name);
          $value = $field->value;

          // Handle entity reference fields.
          if ($field->getFieldDefinition()->getType() === 'entity_reference') {
            $referenced_entity = $field->entity;
            $value = $referenced_entity ? $referenced_entity->label() : '';
          }

          $replacements["[target_entity:{$field_name}]"] = $value;
        }
      }
    }

    // Get custom tokens for the target entity.
    $custom_tokens = $this->getCustomEntityTokens($entity);
    $replacements = array_merge($replacements, $custom_tokens);

    return strtr($text, $replacements);
  }

  /**
   * Get custom tokens for the target entity.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The target entity.
   *
   * @return array
   *   Array of custom tokens.
   */
  protected function getCustomEntityTokens(EntityInterface $entity) {
    $tokens = [];

    // Add entity-specific tokens based on entity type.
    switch ($entity->getEntityTypeId()) {
      case 'application':
        $tokens = $this->getApplicationTokens($entity);
        break;

      case 'node':
        $tokens = $this->getNodeTokens($entity);
        break;

      case 'user':
        $tokens = $this->getUserTokens($entity);
        break;
    }

    return $tokens;
  }

  /**
   * Get tokens specific to loan applications.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The application entity.
   *
   * @return array
   *   Array of application-specific tokens.
   */
  protected function getApplicationTokens(EntityInterface $entity) {
    $tokens = [];

    // Basic application information.
    if ($entity->hasField('application_id') && !$entity->get('application_id')->isEmpty()) {
      $tokens['[target_entity:application_id]'] = $entity->get('application_id')->value;
    }

    if ($entity->hasField('group_name') && !$entity->get('group_name')->isEmpty()) {
      $tokens['[target_entity:group_name]'] = $entity->get('group_name')->value;
    }

    if ($entity->hasField('group_registration_number') && !$entity->get('group_registration_number')->isEmpty()) {
      $tokens['[target_entity:group_registration_number]'] = $entity->get('group_registration_number')->value;
    }

    // Loan details.
    if ($entity->hasField('loan_amount') && !$entity->get('loan_amount')->isEmpty()) {
      $loan_amount = $entity->get('loan_amount')->value;
      $tokens['[target_entity:loan_amount]'] = number_format($loan_amount);
    }

    if ($entity->hasField('proposed_repayment_period') && !$entity->get('proposed_repayment_period')->isEmpty()) {
      $tokens['[target_entity:proposed_repayment_period]'] = $entity->get('proposed_repayment_period')->value;
    }

    // Bank details.
    if ($entity->hasField('bank_name') && !$entity->get('bank_name')->isEmpty()) {
      $tokens['[target_entity:bank_name]'] = $entity->get('bank_name')->value;
    }

    if ($entity->hasField('bank_account_number') && !$entity->get('bank_account_number')->isEmpty()) {
      $tokens['[target_entity:bank_account_number]'] = $entity->get('bank_account_number')->value;
    }

    // Business details.
    if ($entity->hasField('nature_of_business') && !$entity->get('nature_of_business')->isEmpty()) {
      $tokens['[target_entity:nature_of_business]'] = $entity->get('nature_of_business')->value;
    }

    if ($entity->hasField('average_income') && !$entity->get('average_income')->isEmpty()) {
      $average_income = $entity->get('average_income')->value;
      $tokens['[target_entity:average_income]'] = number_format($average_income);
    }

    // Location details.
    if ($entity->hasField('ward') && !$entity->get('ward')->isEmpty()) {
      $tokens['[target_entity:ward]'] = $entity->get('ward')->value;
    }

    if ($entity->hasField('meeting_point') && !$entity->get('meeting_point')->isEmpty()) {
      $tokens['[target_entity:meeting_point]'] = $entity->get('meeting_point')->value;
    }

    if ($entity->hasField('nearest_landmark') && !$entity->get('nearest_landmark')->isEmpty()) {
      $tokens['[target_entity:nearest_landmark]'] = $entity->get('nearest_landmark')->value;
    }

    // Rejection details.
    if ($entity->hasField('rejection_reason') && !$entity->get('rejection_reason')->isEmpty()) {
      $rejection_reason = $entity->get('rejection_reason')->value;
      $tokens['[target_entity:rejection_reason]'] = $rejection_reason;

      // Add human-readable rejection reason label.
      $rejection_reasons = [
        'incomplete_information' => $this->t('Incomplete or incorrect information'),
        'missing_documents' => $this->t('Required documents missing or invalid'),
        'eligibility_criteria' => $this->t('Does not meet eligibility criteria'),
        'duplicate_application' => $this->t('Duplicate application'),
        'insufficient_collateral' => $this->t('Insufficient collateral'),
        'poor_credit_history' => $this->t('Poor credit history'),
        'other' => $this->t('Other reason'),
      ];

      $tokens['[target_entity:rejection_reason_label]'] = $rejection_reasons[$rejection_reason] ?? $rejection_reason;
    }

    if ($entity->hasField('rejection_message') && !$entity->get('rejection_message')->isEmpty()) {
      $tokens['[target_entity:rejection_message]'] = $entity->get('rejection_message')->value;
    }

    // Nature of group.
    if ($entity->hasField('nature_of_group') && !$entity->get('nature_of_group')->isEmpty()) {
      $nature_of_group = $entity->get('nature_of_group')->value;
      $nature_labels = [
        'youth' => $this->t('Youth'),
        'pwd' => $this->t('People with disabilities'),
        'women' => $this->t('Women'),
      ];
      $tokens['[target_entity:nature_of_group]'] = $nature_labels[$nature_of_group] ?? $nature_of_group;
    }

    // Table banking details.
    if ($entity->hasField('table_banking_duration') && !$entity->get('table_banking_duration')->isEmpty()) {
      $tokens['[target_entity:table_banking_duration]'] = $entity->get('table_banking_duration')->value;
    }

    if ($entity->hasField('monthly_share_contribution') && !$entity->get('monthly_share_contribution')->isEmpty()) {
      $contribution = $entity->get('monthly_share_contribution')->value;
      $tokens['[target_entity:monthly_share_contribution]'] = number_format($contribution);
    }

    if ($entity->hasField('total_amount_loaned') && !$entity->get('total_amount_loaned')->isEmpty()) {
      $total_loaned = $entity->get('total_amount_loaned')->value;
      $tokens['[target_entity:total_amount_loaned]'] = number_format($total_loaned);
    }

    if ($entity->hasField('total_revolving_fund') && !$entity->get('total_revolving_fund')->isEmpty()) {
      $revolving_fund = $entity->get('total_revolving_fund')->value;
      $tokens['[target_entity:total_revolving_fund]'] = number_format($revolving_fund);
    }

    return $tokens;
  }

  /**
   * Get tokens specific to nodes.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The node entity.
   *
   * @return array
   *   Array of node-specific tokens.
   */
  protected function getNodeTokens(EntityInterface $entity) {
    $tokens = [];

    if ($entity->hasField('title') && !$entity->get('title')->isEmpty()) {
      $tokens['[target_entity:title]'] = $entity->get('title')->value;
    }

    if ($entity->hasField('type')) {
      $tokens['[target_entity:type]'] = $entity->bundle();
    }

    return $tokens;
  }

  /**
   * Get tokens specific to users.
   *
   * @param \Drupal\Core\Entity\EntityInterface $entity
   *   The user entity.
   *
   * @return array
   *   Array of user-specific tokens.
   */
  protected function getUserTokens(EntityInterface $entity) {
    $tokens = [];

    if ($entity->hasField('name') && !$entity->get('name')->isEmpty()) {
      $tokens['[target_entity:account-name]'] = $entity->get('name')->value;
    }

    if ($entity->hasField('mail') && !$entity->get('mail')->isEmpty()) {
      $tokens['[target_entity:mail]'] = $entity->get('mail')->value;
    }

    // Add display name (falls back to username if no display name).
    $display_name = $entity->getDisplayName();
    $tokens['[target_entity:display-name]'] = $display_name;

    return $tokens;
  }

  /**
   * Converts a status value to human-readable format.
   *
   * @param string|null $status
   *   The status value.
   *
   * @return string
   *   The human-readable status.
   */
  protected function humanizeStatus($status) {
    if (empty($status)) {
      return $this->t('(none)');
    }

    // Replace underscores and hyphens with spaces.
    $status = str_replace(['_', '-'], ' ', $status);

    // Capitalize each word.
    return ucwords(strtolower($status));
  }

  /**
   * Gets a list of available tokens with descriptions.
   *
   * @return array
   *   Array of available tokens grouped by category.
   */
  public function getAvailableTokens() {
    return [
      'status_change' => [
        'label' => $this->t('Status Change'),
        'tokens' => [
          '[status_change:id]' => $this->t('Status change ID'),
          '[status_change:entity-type]' => $this->t('Target entity type'),
          '[status_change:entity-id]' => $this->t('Target entity ID'),
          '[status_change:entity-label]' => $this->t('Target entity label'),
          '[status_change:entity-url]' => $this->t('Target entity URL'),
          '[status_change:field]' => $this->t('Status field name'),
          '[status_change:old-status]' => $this->t('Previous status (raw value)'),
          '[status_change:old-status:human]' => $this->t('Previous status (human-readable)'),
          '[status_change:new-status]' => $this->t('New status (raw value)'),
          '[status_change:new-status:human]' => $this->t('New status (human-readable)'),
          '[status_change:source]' => $this->t('Change source'),
          '[status_change:notes]' => $this->t('Change notes'),
          '[status_change:created]' => $this->t('Change date (medium format)'),
          '[status_change:created:short]' => $this->t('Change date (short format)'),
          '[status_change:created:long]' => $this->t('Change date (long format)'),
          '[status_change:user]' => $this->t('User who made the change'),
          '[status_change:user:mail]' => $this->t('User email'),
          '[status_change:user:uid]' => $this->t('User ID'),
        ],
      ],
      'target_entity' => [
        'label' => $this->t('Target Entity'),
        'tokens' => [
          '[target_entity:id]' => $this->t('Entity ID'),
          '[target_entity:label]' => $this->t('Entity label'),
          '[target_entity:type]' => $this->t('Entity type'),
          '[target_entity:bundle]' => $this->t('Entity bundle'),
          '[target_entity:url]' => $this->t('Entity URL'),
          '[target_entity:created]' => $this->t('Creation date'),
          '[target_entity:changed]' => $this->t('Last modified date'),
          '[target_entity:field_*]' => $this->t('Any field value (replace * with field name)'),
        ],
      ],
      'site' => [
        'label' => $this->t('Site Information'),
        'description' => $this->t('Tokens from Drupal core'),
        'tokens' => [
          '[site:name]' => $this->t('Site name'),
          '[site:url]' => $this->t('Site URL'),
          '[site:mail]' => $this->t('Site email'),
          '[site:slogan]' => $this->t('Site slogan'),
        ],
      ],
      'current-date' => [
        'label' => $this->t('Current Date'),
        'description' => $this->t('Tokens from Drupal core'),
        'tokens' => [
          '[current-date:short]' => $this->t('Current date (short format)'),
          '[current-date:medium]' => $this->t('Current date (medium format)'),
          '[current-date:long]' => $this->t('Current date (long format)'),
        ],
      ],
    ];
  }

}
