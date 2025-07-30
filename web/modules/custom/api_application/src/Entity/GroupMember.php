<?php

namespace Drupal\api_application\Entity;

use Drupal\Core\File\FileSystemInterface;
use Drupal\file\FileInterface;
use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\EntityChangedTrait;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Field\BaseFieldDefinition;
use Drupal\Core\Entity\EntityStorageInterface;

/**
 * Defines the Group Member entity.
 *
 * @ingroup api_application
 *
 * @ContentEntityType(
 *   id = "group_member",
 *   label = @Translation("Group Member"),
 *   label_collection = @Translation("Group Members"),
 *   handlers = {
 *     "view_builder" = "Drupal\Core\Entity\EntityViewBuilder",
 *     "list_builder" = "Drupal\api_application\GroupMemberListBuilder",
 *     "views_data" = "Drupal\views\EntityViewsData",
 *     "access" = "Drupal\api_application\GroupMemberAccessControlHandler",
 *     "form" = {
 *       "default" = "Drupal\api_application\Form\GroupMemberForm",
 *       "add" = "Drupal\api_application\Form\GroupMemberForm",
 *       "edit" = "Drupal\api_application\Form\GroupMemberForm",
 *       "delete" = "Drupal\Core\Entity\ContentEntityDeleteForm"
 *     },
 *     "route_provider" = {
 *       "html" = "Drupal\Core\Entity\Routing\AdminHtmlRouteProvider",
 *     },
 *   },
 *   base_table = "group_member",
 *   data_table = "group_member_field_data",
 *   translatable = FALSE,
 *   admin_permission = "administer group members",
 *   entity_keys = {
 *     "id" = "id",
 *     "uuid" = "uuid",
 *     "label" = "name",
 *     "langcode" = "langcode",
 *   },
 *   links = {
 *     "canonical" = "/admin/content/group-member/{group_member}",
 *     "add-form" = "/admin/content/group-member/add",
 *     "edit-form" = "/admin/content/group-member/{group_member}/edit",
 *     "delete-form" = "/admin/content/group-member/{group_member}/delete",
 *     "collection" = "/admin/content/group-members",
 *   },
 *   field_ui_base_route = "entity.group_member.settings",
 * )
 */
class GroupMember extends ContentEntityBase implements GroupMemberInterface {

  use EntityChangedTrait;

  /**
   * {@inheritdoc}
   */
  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $fields = parent::baseFieldDefinitions($entity_type);

    $fields['name'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Name'))
      ->setDescription(t('The name of the group member.'))
      ->setRequired(TRUE)
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayOptions('view', [
        'label' => 'hidden',
        'type' => 'string',
        'weight' => 0,
      ])
      ->setDisplayOptions('form', [
        'type' => 'string_textfield',
        'weight' => 0,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['id_number'] = BaseFieldDefinition::create('string')
      ->setLabel(t('ID'))
      ->setDescription(t('The national ID number of the member.'))
      ->setRequired(TRUE)
      ->setSettings([
        'max_length' => 50,
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

    $fields['gender'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Gender'))
      ->setDescription(t('The gender of the member.'))
      ->setRequired(TRUE)
      ->setSetting('allowed_values', [
        'male' => t('Male'),
        'female' => t('Female'),
        'other' => t('Other'),
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'list_default',
        'weight' => 2,
      ])
      ->setDisplayOptions('form', [
        'type' => 'options_select',
        'weight' => 2,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['phone_number'] = BaseFieldDefinition::create('telephone')
      ->setLabel(t('Phone number'))
      ->setDescription(t('The phone number of the member.'))
      ->setRequired(TRUE)
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'telephone_link',
        'weight' => 3,
      ])
      ->setDisplayOptions('form', [
        'type' => 'telephone_default',
        'weight' => 3,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['position'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Position of member'))
      ->setDescription(t('The position/role of the member in the group. Start typing to search existing positions or create a new one.'))
      ->setRequired(TRUE)
      ->setSetting('target_type', 'taxonomy_term')
      ->setSetting('handler', 'default:taxonomy_term')
      ->setSetting('handler_settings', [
        'target_bundles' => [
          'position_of_member' => 'position_of_member',
        ],
        'sort' => [
          'field' => 'name',
          'direction' => 'asc',
        ],
        'auto_create' => TRUE,
        'auto_create_bundle' => 'position_of_member',
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'entity_reference_label',
        'weight' => 4,
      ])
      ->setDisplayOptions('form', [
        'type' => 'entity_reference_autocomplete',
        'weight' => 4,
        'settings' => [
          'match_operator' => 'CONTAINS',
          'size' => '60',
          'autocomplete_type' => 'tags',
          'placeholder' => 'Type to search existing positions or add new one...',
        ],
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['photo_member_id'] = BaseFieldDefinition::create('image')
      ->setLabel(t('Photo of member ID'))
      ->setDescription(t("Upload a photo of the member's ID."))
      ->setRequired(TRUE)
      ->setSettings([
        'file_directory' => 'applications/member_ids/[date:custom:Y]-[date:custom:m]',
        'alt_field_required' => FALSE,
        'file_extensions' => 'png jpg jpeg webp',
        'max_filesize' => '2MB',
      ])
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'image',
        'weight' => 5,
        'settings' => [
          'image_style' => 'thumbnail',
        ],
      ])
      ->setDisplayOptions('form', [
        'type' => 'image_image',
        'weight' => 5,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['person_with_disability'] = BaseFieldDefinition::create('boolean')
      ->setLabel(t('Person with disability'))
      ->setDescription(t('Check if the member is a person with disability.'))
      ->setDefaultValue(FALSE)
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'boolean',
        'weight' => 6,
        'settings' => [
          'format' => 'yes-no',
        ],
      ])
      ->setDisplayOptions('form', [
        'type' => 'boolean_checkbox',
        'weight' => 6,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['certificate_disability'] = BaseFieldDefinition::create('file')
      ->setLabel(t('Certificate of disability'))
      ->setDescription(t('Upload the disability certificate (PDF or Image).'))
      ->setSetting('file_extensions', 'pdf jpg jpeg png webp')
      ->setSetting('file_directory', 'applications/disability_certs/[date:custom:Y]-[date:custom:m]')
      ->setSetting('max_filesize', '2MB')
      ->setSetting('handler', 'default:file')
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'file_default',
        'weight' => 7,
      ])
      ->setDisplayOptions('form', [
        'type' => 'file_generic',
        'weight' => 7,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['pwd_number'] = BaseFieldDefinition::create('string')
      ->setLabel(t('PWD number'))
      ->setDescription(t('The PWD registration number.'))
      ->setSettings([
        'max_length' => 50,
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

    $fields['application'] = BaseFieldDefinition::create('entity_reference')
      ->setLabel(t('Application'))
      ->setDescription(t('The application this member belongs to.'))
      ->setSetting('target_type', 'application')
      ->setSetting('handler', 'default')
      ->setDisplayOptions('view', [
        'label' => 'visible',
        'type' => 'entity_reference_label',
        'weight' => 9,
      ])
      ->setDisplayConfigurable('view', TRUE);

    // SMS Confirmation fields.
    $fields['confirmation_status'] = BaseFieldDefinition::create('list_string')
      ->setLabel(t('Confirmation Status'))
      ->setDescription(t('The SMS confirmation status of the member.'))
      ->setDefaultValue('pending')
      ->setSetting('allowed_values', [
        'pending' => t('Pending'),
        'sent' => t('SMS Sent'),
        'confirmed' => t('Confirmed'),
        'declined' => t('Declined'),
        'failed' => t('Failed'),
      ])
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'list_default',
        'weight' => 10,
      ])
      ->setDisplayOptions('form', [
        'type' => 'options_select',
        'weight' => 10,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['confirmation_token'] = BaseFieldDefinition::create('string')
      ->setLabel(t('Confirmation Token'))
      ->setDescription(t('Unique token for SMS confirmation link.'))
      ->setSettings([
        'max_length' => 255,
        'text_processing' => 0,
      ])
      ->setDisplayConfigurable('view', FALSE)
      ->setDisplayConfigurable('form', FALSE);

    $fields['confirmation_sent_at'] = BaseFieldDefinition::create('timestamp')
      ->setLabel(t('Confirmation Sent At'))
      ->setDescription(t('Timestamp when the confirmation SMS was sent.'))
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'timestamp',
        'weight' => 11,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', FALSE);

    $fields['confirmation_confirmed_at'] = BaseFieldDefinition::create('timestamp')
      ->setLabel(t('Confirmation Confirmed At'))
      ->setDescription(t('Timestamp when the member confirmed via SMS.'))
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'timestamp',
        'weight' => 12,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', FALSE);

    $fields['requires_confirmation'] = BaseFieldDefinition::create('boolean')
      ->setLabel(t('Requires Confirmation'))
      ->setDescription(t('Whether this member requires SMS confirmation.'))
      ->setDefaultValue(TRUE)
      ->setDisplayOptions('view', [
        'label' => 'inline',
        'type' => 'boolean',
        'weight' => 13,
      ])
      ->setDisplayOptions('form', [
        'type' => 'boolean_checkbox',
        'weight' => 13,
      ])
      ->setDisplayConfigurable('view', TRUE)
      ->setDisplayConfigurable('form', TRUE);

    $fields['created'] = BaseFieldDefinition::create('created')
      ->setLabel(t('Created'))
      ->setDescription(t('The time that the member was created.'));

    $fields['changed'] = BaseFieldDefinition::create('changed')
      ->setLabel(t('Changed'))
      ->setDescription(t('The time that the member was last edited.'));

    return $fields;
  }

  /**
   * {@inheritdoc}
   */
  public function getName() {
    return $this->get('name')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setName($name) {
    $this->set('name', $name);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getIdNumber() {
    return $this->get('id_number')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setIdNumber($id) {
    $this->set('id_number', $id);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getGender() {
    return $this->get('gender')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setGender($gender) {
    $this->set('gender', $gender);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getPhoneNumber() {
    return $this->get('phone_number')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setPhoneNumber($phone) {
    $this->set('phone_number', $phone);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getPosition() {
    return $this->get('position')->entity;
  }

  /**
   * {@inheritdoc}
   */
  public function setPosition($position) {
    $this->set('position', $position);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function isPersonWithDisability() {
    return (bool) $this->get('person_with_disability')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setPersonWithDisability($value) {
    $this->set('person_with_disability', $value);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getPwdNumber() {
    return $this->get('pwd_number')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setPwdNumber($number) {
    $this->set('pwd_number', $number);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getApplication() {
    return $this->get('application')->entity;
  }

  /**
   * {@inheritdoc}
   */
  public function setApplication(ApplicationInterface $application) {
    $this->set('application', $application->id());
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getConfirmationStatus() {
    return $this->get('confirmation_status')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setConfirmationStatus($status) {
    $this->set('confirmation_status', $status);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getConfirmationToken() {
    return $this->get('confirmation_token')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setConfirmationToken($token) {
    $this->set('confirmation_token', $token);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getConfirmationSentAt() {
    return $this->get('confirmation_sent_at')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setConfirmationSentAt($timestamp) {
    $this->set('confirmation_sent_at', $timestamp);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getConfirmationConfirmedAt() {
    return $this->get('confirmation_confirmed_at')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setConfirmationConfirmedAt($timestamp) {
    $this->set('confirmation_confirmed_at', $timestamp);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function isConfirmed() {
    return $this->getConfirmationStatus() === 'confirmed';
  }

  /**
   * {@inheritdoc}
   */
  public function generateConfirmationToken() {
    $token = bin2hex(random_bytes(32));
    $this->setConfirmationToken($token);
    return $token;
  }

  /**
   * {@inheritdoc}
   */
  public function requiresConfirmation() {
    return (bool) $this->get('requires_confirmation')->value;
  }

  /**
   * {@inheritdoc}
   */
  public function setRequiresConfirmation($value) {
    $this->set('requires_confirmation', $value);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function preSave(EntityStorageInterface $storage) {
    parent::preSave($storage);

    // Auto-confirm members who don't require confirmation.
    if (!$this->requiresConfirmation() && $this->getConfirmationStatus() !== 'confirmed') {
      $this->setConfirmationStatus('confirmed');
      $this->setConfirmationConfirmedAt(\Drupal::time()->getRequestTime());
    }

    // Handle file organization if not new and has application.
    if (!$this->isNew() && $this->getApplication()) {
      $this->organizeGroupMemberFiles();
    }
  }

  /**
   * {@inheritdoc}
   */
  public function postSave(EntityStorageInterface $storage, $update = TRUE) {
    parent::postSave($storage, $update);

    // Handle file organization for new group members.
    if (!$update && $this->getApplication()) {
      $this->organizeGroupMemberFiles();
    }
  }

  /**
   * Organize group member files into application-specific directories.
   */
  protected function organizeGroupMemberFiles() {
    $application = $this->getApplication();

    if (!$application) {
      return;
    }

    $application_id = $application->getApplicationId();

    if (empty($application_id)) {
      return;
    }

    $file_fields = [
      'photo_member_id' => 'member_ids',
      'certificate_disability' => 'disability_certs',
    ];

    $file_system = \Drupal::service('file_system');
    $file_storage = \Drupal::entityTypeManager()->getStorage('file');

    foreach ($file_fields as $field_name => $subdirectory) {
      if ($this->hasField($field_name) && !$this->get($field_name)->isEmpty()) {
        $file_id = $this->get($field_name)->target_id;

        if ($file_id) {
          $file = $file_storage->load($file_id);

          if ($file instanceof FileInterface) {
            $current_uri = $file->getFileUri();

            // Check if file is already in the correct directory.
            $expected_dir_pattern = 'public://applications/' . $application_id . '/' . $subdirectory;

            if (strpos($current_uri, $expected_dir_pattern) === FALSE) {
              // Move file to application-specific directory.
              $new_directory = 'public://applications/' . $application_id . '/' . $subdirectory;
              $file_system->prepareDirectory($new_directory, FileSystemInterface::CREATE_DIRECTORY);

              $filename = $file->getFilename();
              $new_uri = $new_directory . '/' . $filename;

              // Move the file.
              $moved_uri = $file_system->move($current_uri, $new_uri, FileSystemInterface::EXISTS_RENAME);

              if ($moved_uri) {
                $file->setFileUri($moved_uri);
                $file->save();
              }
            }
          }
        }
      }
    }
  }

}
