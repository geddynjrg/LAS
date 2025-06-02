<?php

namespace Drupal\api_application\Entity;

use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\EntityChangedTrait;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Field\BaseFieldDefinition;
use Drupal\user\EntityOwnerTrait;

/**
 * Defines the Application entity.
 *
 * @ingroup api_application
 *
 * @ContentEntityType(
 *   id = "application",
 *   label = @Translation("Loan Application"),
 *   label_collection = @Translation("Loan Applications"),
 *   handlers = {
 *     "view_builder" = "Drupal\Core\Entity\EntityViewBuilder",
 *     "list_builder" = "Drupal\api_application\ApplicationListBuilder",
 *     "views_data" = "Drupal\views\EntityViewsData",
 *     "access" = "Drupal\api_application\ApplicationAccessControlHandler",
 *     "form" = {
 *       "default" = "Drupal\api_application\Form\ApplicationForm",
 *       "add" = "Drupal\api_application\Form\ApplicationForm",
 *       "edit" = "Drupal\api_application\Form\ApplicationForm",
 *       "delete" = "Drupal\Core\Entity\ContentEntityDeleteForm",
 *     },
 *     "route_provider" = {
 *       "html" = "Drupal\api_application\ApplicationHtmlRouteProvider",
 *     },
 *   },
 *   base_table = "application",
 *   data_table = "application_field_data",
 *   revision_table = "application_revision",
 *   revision_data_table = "application_field_revision",
 *   translatable = FALSE,
 *   admin_permission = "administer loan applications",
 *   entity_keys = {
 *     "id" = "id",
 *     "revision" = "vid",
 *     "uuid" = "uuid",
 *     "uid" = "uid",
 *     "owner" = "uid",
 *     "label" = "group_name",
 *     "status" = "status",
 *     "published" = "status",
 *     "created" = "created",
 *     "changed" = "changed",
 *   },
 *   links = {
 *     "canonical" = "/application/{application}",
 *     "add-form" = "/application/add",
 *     "edit-form" = "/application/{application}/edit",
 *     "delete-form" = "/application/{application}/delete",
 *     "collection" = "/admin/content/applications",
 *   },
 *   field_ui_base_route = "entity.application.settings",
 *   revision_metadata_keys = {
 *     "revision_user" = "revision_uid",
 *     "revision_created" = "revision_timestamp",
 *     "revision_log_message" = "revision_log",
 *   },
 * )
 */
class Application extends ContentEntityBase implements ApplicationInterface {

  use EntityChangedTrait;
  use EntityOwnerTrait;

  /**
   * {@inheritdoc}
   */
  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $fields = parent::baseFieldDefinitions($entity_type);
    $fields += static::ownerBaseFieldDefinitions($entity_type);

    // Application status field
    $fields['status'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Application Status'))
      ->setDescription(t('The current status of the application.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setDefaultValue('draft')
      ->setSetting('allowed_values', [
        'draft' => t('Draft'),
        'submitted' => t('Submitted'),
        'under_review' => t('Under Review'),
        'approved' => t('Approved'),
        'rejected' => t('Rejected'),
        'disbursed' => t('Disbursed'),
        'closed' => t('Closed'),
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'list_default',
        'weight' => -10,
      ])
      ->setDisplayOptions('form', [
        'type' => 'options_select',
        'weight' => -10,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    // Step 1: Group Data Fields
    $fields['group_name'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Group name'))
      ->setDescription(t('The name of the group applying for the loan.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'string',
        'weight' => 0,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 0,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['group_registration_number'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Group registration number'))
      ->setDescription(t('The official registration number of the group.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSettings([
        'max_length' => 100,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'string',
        'weight' => 1,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 1,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['date_registered'] = BaseFieldDefinition::create('datetime')
      ->setLabel(t('Date registered'))
      ->setDescription(t('The date when the group was registered.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('datetime_type', 'date')
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'datetime_default',
        'weight' => 2,
        'settings' => [
          'format_type' => 'medium',
        ],
      ])
      ->setDisplayOptions('form', [
        'type' => 'datetime_default',
        'weight' => 2,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['group_registration_certificate'] = BaseFieldDefinition::create('file')
      ->setLabel(t('Group registration certificate'))
      ->setDescription(t('Upload the group registration certificate (PDF or Image).'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('file_extensions', 'pdf jpg jpeg png')
      ->setSetting('file_directory', 'applications/certificates/[date:custom:Y]-[date:custom:m]')
      ->setSetting('max_filesize', '5MB')
      ->setSetting('handler', 'default:file')
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'file_default',
        'weight' => 3,
      ])
      ->setDisplayOptions('form', [
        'type' => 'file_generic',
        'weight' => 3,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['list_of_members_certificate'] = BaseFieldDefinition::create('file')
      ->setLabel(t('List of members on certificate'))
      ->setDescription(t('Upload the list of members on certificate (PDF or Image).'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('file_extensions', 'pdf jpg jpeg png')
      ->setSetting('file_directory', 'applications/members/[date:custom:Y]-[date:custom:m]')
      ->setSetting('max_filesize', '5MB')
      ->setSetting('handler', 'default:file')
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'file_default',
        'weight' => 4,
      ])
      ->setDisplayOptions('form', [
        'type' => 'file_generic',
        'weight' => 4,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['group_background'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Group background'))
      ->setDescription(t('Select the group background categories.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setCardinality(BaseFieldDefinition::CARDINALITY_UNLIMITED)
      ->setSetting('target_type', 'taxonomy_term')
      ->setSetting('handler', 'default:taxonomy_term')
      ->setSetting('handler_settings', [
        'target_bundles' => [
          'group_background' => 'group_background',
        ],
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'entity_reference_label',
        'weight' => 5,
      ])
      ->setDisplayOptions('form', [
        'type' => 'entity_reference_autocomplete',
        'weight' => 5,
        'settings' => [
          'match_operator' => 'CONTAINS',
          'size' => '60',
          'placeholder' => '',
        ],
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['key_activities'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Key activities of the group'))
      ->setDescription(t('Select all key activities that apply.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setCardinality(BaseFieldDefinition::CARDINALITY_UNLIMITED)
      ->setSetting('allowed_values', [
        'value_chain' => t('Value chain'),
        'table_banking' => t('Table banking'),
        'other' => t('Other'),
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'list_default',
        'weight' => 6,
      ])
      ->setDisplayOptions('form', [
        'type' => 'options_buttons',
        'weight' => 6,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['value_chain'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Value chain'))
      ->setDescription(t('Select the value chain categories.'))
      ->setRevisionable(TRUE)
      ->setCardinality(BaseFieldDefinition::CARDINALITY_UNLIMITED)
      ->setSetting('target_type', 'taxonomy_term')
      ->setSetting('handler', 'default:taxonomy_term')
      ->setSetting('handler_settings', [
        'target_bundles' => [
          'value_chain' => 'value_chain',
        ],
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'entity_reference_label',
        'weight' => 7,
      ])
      ->setDisplayOptions('form', [
        'type' => 'entity_reference_autocomplete',
        'weight' => 7,
        'settings' => [
          'match_operator' => 'CONTAINS',
          'size' => '60',
          'placeholder' => '',
        ],
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    // Table banking fields (conditionally shown)
    $fields['table_banking_duration'] = BaseFieldDefinition::create('string')
      ->setLabel(t('How long has the group practiced table banking?'))
      ->setDescription(t('Duration of table banking practice.'))
      ->setRevisionable(TRUE)
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'string',
        'weight' => 8,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 8,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['monthly_share_contribution'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('Total monthly share contribution'))
      ->setDescription(t('The total monthly share contribution amount.'))
      ->setRevisionable(TRUE)
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'number_integer',
        'weight' => 9,
        'settings' => [
          'thousand_separator' => ',',
          'prefix_suffix' => TRUE,
        ],
      ])
      ->setDisplayOptions('form', [
        'type' => 'number',
        'weight' => 9,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['total_amount_loaned'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('Total amount loaned out'))
      ->setDescription(t('The total amount loaned out by the group.'))
      ->setRevisionable(TRUE)
      ->setSetting('suffix', 'KSh')
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'number_integer',
        'weight' => 10,
        'settings' => [
          'thousand_separator' => ',',
          'prefix_suffix' => TRUE,
        ],
      ])
      ->setDisplayOptions('form', [
        'type' => 'number',
        'weight' => 10,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['total_revolving_fund'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('Total revolving fund'))
      ->setDescription(t('The total revolving fund amount.'))
      ->setRevisionable(TRUE)
      ->setSetting('suffix', 'KSh')
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'number_integer',
        'weight' => 11,
        'settings' => [
          'thousand_separator' => ',',
          'prefix_suffix' => TRUE,
        ],
      ])
      ->setDisplayOptions('form', [
        'type' => 'number',
        'weight' => 11,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['other_activities'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Specify other activities'))
      ->setDescription(t('Please specify other activities if selected.'))
      ->setRevisionable(TRUE)
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'string',
        'weight' => 12,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 12,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['group_credit_history'] = BaseFieldDefinition::create('file')
      ->setLabel(t('Group credit history'))
      ->setDescription(t('Upload the group credit history document (PDF or Image).'))
      ->setRevisionable(TRUE)
      ->setSetting('file_extensions', 'pdf jpg jpeg png')
      ->setSetting('file_directory', 'applications/credit_history/[date:custom:Y]-[date:custom:m]')
      ->setSetting('max_filesize', '5MB')
      ->setSetting('handler', 'default:file')
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'file_default',
        'weight' => 13,
      ])
      ->setDisplayOptions('form', [
        'type' => 'file_generic',
        'weight' => 13,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    // Location fields
    $fields['county'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('County of operations'))
      ->setDescription(t('Select the county where the group operates.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('target_type', 'taxonomy_term')
      ->setSetting('handler', 'default:taxonomy_term')
      ->setSetting('handler_settings', [
        'target_bundles' => [
          'counties' => 'counties',
        ],
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'entity_reference_label',
        'weight' => 14,
      ])
      ->setDisplayOptions('form', [
        'type' => 'entity_reference_autocomplete',
        'weight' => 14,
        'settings' => [
          'match_operator' => 'CONTAINS',
          'size' => '60',
          'placeholder' => '',
        ],
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['constituency'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Constituency'))
      ->setDescription(t('Select the constituency.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('target_type', 'taxonomy_term')
      ->setSetting('handler', 'default:taxonomy_term')
      ->setSetting('handler_settings', [
        'target_bundles' => [
          'constituencies' => 'constituencies',
        ],
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'entity_reference_label',
        'weight' => 15,
      ])
      ->setDisplayOptions('form', [
        'type' => 'entity_reference_autocomplete',
        'weight' => 15,
        'settings' => [
          'match_operator' => 'CONTAINS',
          'size' => '60',
          'placeholder' => '',
        ],
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['ward'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Ward'))
      ->setDescription(t('Enter the ward name.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'string',
        'weight' => 16,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 16,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['meeting_point'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Meeting point'))
      ->setDescription(t('Where does the group usually meet?'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'string',
        'weight' => 17,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 17,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['nearest_landmark'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Nearest landmark'))
      ->setDescription(t('What is the nearest landmark to the meeting point?'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'string',
        'weight' => 18,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 18,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    // Step 2: Group Members
    $fields['nature_of_group'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Nature of the group'))
      ->setDescription(t('Select the nature of the group.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('allowed_values', [
        'youth' => t('Youth'),
        'pwd' => t('People with disabilities'),
        'women' => t('Women'),
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'list_default',
        'weight' => 20,
      ])
      ->setDisplayOptions('form', [
        'type' => 'options_select',
        'weight' => 20,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['group_members'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Group members'))
      ->setDescription(t('The members of this group.'))
      ->setRevisionable(TRUE)
      ->setCardinality(BaseFieldDefinition::CARDINALITY_UNLIMITED)
      ->setSetting('target_type', 'group_member')
      ->setSetting('handler', 'default')
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'entity_reference_entity_view',
        'weight' => 21,
      ])
      ->setDisplayOptions('form', [
        'type' => 'inline_entity_form_complex',
        'weight' => 21,
        'settings' => [
          'form_mode' => 'default',
          'allow_new' => TRUE,
          'allow_existing' => FALSE,
          'match_operator' => 'CONTAINS',
        ],
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    // Step 3: Loan Conditions
    $fields['purpose_of_loan'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Purpose of the loan'))
      ->setDescription(t('Select the purpose of the loan.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('allowed_values', [
        'table_banking' => t('Table banking'),
        'common_group_project' => t('Common group project'),
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'list_default',
        'weight' => 30,
      ])
      ->setDisplayOptions('form', [
        'type' => 'options_select',
        'weight' => 30,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['loan_type'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Loan type'))
      ->setDescription(t('Select the type of loan.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('target_type', 'taxonomy_term')
      ->setSetting('handler', 'default:taxonomy_term')
      ->setSetting('handler_settings', [
        'target_bundles' => [
          'loan_types' => 'loan_types',
        ],
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'entity_reference_label',
        'weight' => 31,
      ])
      ->setDisplayOptions('form', [
        'type' => 'entity_reference_autocomplete',
        'weight' => 31,
        'settings' => [
          'match_operator' => 'CONTAINS',
          'size' => '60',
          'placeholder' => '',
        ],
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['loan_amount'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('Loan amount'))
      ->setDescription(t('The requested loan amount in KSh.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('min', 0)
      ->setSetting('suffix', 'KSh')
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'number_integer',
        'weight' => 32,
        'settings' => [
          'thousand_separator' => ',',
          'prefix_suffix' => TRUE,
        ],
      ])
      ->setDisplayOptions('form', [
        'type' => 'number',
        'weight' => 32,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['proposed_repayment_period'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('Proposed repayment period in months'))
      ->setDescription(t('The proposed repayment period (1-12 months).'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('min', 1)
      ->setSetting('max', 12)
      ->setSetting('suffix', 'months')
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'number_integer',
        'weight' => 33,
        'settings' => [
          'prefix_suffix' => TRUE,
        ],
      ])
      ->setDisplayOptions('form', [
        'type' => 'number',
        'weight' => 33,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    // Bank account details
    $fields['bank_name'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Group Bank name'))
      ->setDescription(t('The name of the bank.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'string',
        'weight' => 34,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 34,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['bank_branch'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Group Bank branch'))
      ->setDescription(t('The bank branch name.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'string',
        'weight' => 35,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 35,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['bank_account_number'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Bank Account number'))
      ->setDescription(t('The bank account number.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSettings([
        'max_length' => 50,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'string',
        'weight' => 36,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 36,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    // Step 4: Proposed Business
    $fields['nature_of_business'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Nature of business'))
      ->setDescription(t('Is this a startup or expansion?'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('allowed_values', [
        'startup' => t('Start-up'),
        'expansion' => t('Expansion'),
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'list_default',
        'weight' => 40,
      ])
      ->setDisplayOptions('form', [
        'type' => 'options_select',
        'weight' => 40,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['business_type'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Business type'))
      ->setDescription(t('Select the type of business.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setCardinality(BaseFieldDefinition::CARDINALITY_UNLIMITED)
      ->setSetting('target_type', 'taxonomy_term')
      ->setSetting('handler', 'default:taxonomy_term')
      ->setSetting('handler_settings', [
        'target_bundles' => [
          'business_types' => 'business_types',
        ],
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'entity_reference_label',
        'weight' => 41,
      ])
      ->setDisplayOptions('form', [
        'type' => 'options_buttons',
        'weight' => 41,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['years_in_operation'] = BaseFieldDefinition::create('decimal')
      ->setLabel(t('How many years has been in operation?'))
      ->setDescription(t('Number of years the business has been operating.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('precision', 10)
      ->setSetting('scale', 1)
      ->setSetting('min', 0)
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'number_decimal',
        'weight' => 42,
      ])
      ->setDisplayOptions('form', [
        'type' => 'number',
        'weight' => 42,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    // Business performance
    $fields['average_income'] = BaseFieldDefinition::create('integer')
      ->setLabel(t('Average income per month'))
      ->setDescription(t('The average monthly income in KES.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setSetting('min', 0)
      ->setSetting('suffix', 'KES')
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'number_integer',
        'weight' => 43,
        'settings' => [
          'thousand_separator' => ',',
          'prefix_suffix' => TRUE,
        ],
      ])
      ->setDisplayOptions('form', [
        'type' => 'number',
        'weight' => 43,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    // For expenses, we'll use a custom field type or a map field
    $fields['expenses'] = BaseFieldDefinition::create('map')
      ->setLabel(t('Expenses'))
      ->setDescription(t('Monthly business expenses.'))
      ->setRequired(TRUE)
      ->setRevisionable(TRUE)
      ->setCardinality(BaseFieldDefinition::CARDINALITY_UNLIMITED)
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'map_default',
        'weight' => 44,
      ])
      ->setDisplayOptions('form', [
        'type' => 'map_assoc',
        'weight' => 44,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    // Timestamps
    $fields['created'] = BaseFieldDefinition::create('created')
      ->setLabel(t('Created'))
      ->setDescription(t('The time that the application was created.'));

    $fields['changed'] = BaseFieldDefinition::create('changed')
      ->setLabel(t('Changed'))
      ->setDescription(t('The time that the application was last edited.'));

    return $fields;
  }

  /**
   * {@inheritdoc}
   */
  public function getCreatedTime() {
    return $this->get('created')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setCreatedTime($timestamp) {
    $this->set('created', $timestamp);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getStatus() {
    return $this->get('status')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setStatus($status) {
    $this->set('status', $status);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getGroupName() {
    return $this->get('group_name')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setGroupName($name) {
    $this->set('group_name', $name);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getGroupRegistrationNumber() {
    return $this->get('group_registration_number')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setGroupRegistrationNumber($number) {
    $this->set('group_registration_number', $number);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getLoanAmount() {
    return $this->get('loan_amount')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setLoanAmount($amount) {
    $this->set('loan_amount', $amount);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getProposedRepaymentPeriod() {
    return $this->get('proposed_repayment_period')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setProposedRepaymentPeriod($period) {
    $this->set('proposed_repayment_period', $period);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getNatureOfBusiness() {
    return $this->get('nature_of_business')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setNatureOfBusiness($nature) {
    $this->set('nature_of_business', $nature);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getGroupMembers() {
    $members = [];
    foreach ($this->get('group_members') as $item) {
      if ($item->entity) {
        $members[] = $item->entity;
      }
    }
    return $members;
  }

  /**
   * {@inheritdoc}
   */
  public function addGroupMember(GroupMemberInterface $member) {
    $this->get('group_members')->appendItem($member);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function removeGroupMember(GroupMemberInterface $member) {
    $values = $this->get('group_members')->getValue();
    foreach ($values as $key => $value) {
      if ($value['target_id'] == $member->id()) {
        $this->get('group_members')->removeItem($key);
        break;
      }
    }
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function hasTableBanking() {
    $activities = $this->get('key_activities')->getValue();
    foreach ($activities as $activity) {
      if ($activity['value'] === 'table_banking') {
        return TRUE;
      }
    }
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function setTableBanking($value) {
    // This is handled through the key_activities field
    return $this;
  }
} 