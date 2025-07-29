<?php

namespace Drupal\api_application\Entity;

use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\EntityChangedTrait;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Field\BaseFieldDefinition;

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

}
