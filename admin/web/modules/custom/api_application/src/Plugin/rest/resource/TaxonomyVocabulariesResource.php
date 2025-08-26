<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\rest_framework\Plugin\rest\resource\RestFrameworkResourceBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Psr\Log\LoggerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;

/**
 * Provides Taxonomy Vocabularies Resource for Application forms.
 *
 * @RestResource(
 *   id = "application_taxonomy_vocabularies",
 *   label = @Translation("API Application Taxonomy Vocabularies"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/application/taxonomy-vocabularies"
 *   }
 * )
 */
class TaxonomyVocabulariesResource extends RestFrameworkResourceBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Constructs a new TaxonomyVocabulariesResource object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param array $serializer_formats
   *   The available serialization formats.
   * @param \Psr\Log\LoggerInterface $logger
   *   A logger instance.
   * @param \Drupal\Core\Path\PathMatcherInterface $path_matcher
   *   The path matcher service.
   * @param \Drupal\rest_framework\Service\RestFrameworkFieldMapper $field_mapper
   *   The field mapper service.
   * @param \Drupal\Core\Language\LanguageManagerInterface $language_manager
   *   The language manager.
   * @param \Drupal\path_alias\AliasManagerInterface $alias_manager
   *   The path alias manager.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    array $serializer_formats,
    LoggerInterface $logger,
    PathMatcherInterface $path_matcher,
    RestFrameworkFieldMapper $field_mapper,
    LanguageManagerInterface $language_manager,
    AliasManagerInterface $alias_manager,
    EntityTypeManagerInterface $entity_type_manager,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger, $path_matcher, $field_mapper, $language_manager, $alias_manager);
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->getParameter('serializer.formats'),
      $container->get('logger.factory')->get('rest_framework'),
      $container->get('path.matcher'),
      $container->get('rest_framework.field_mapper'),
      $container->get('language_manager'),
      $container->get('path_alias.manager'),
      $container->get('entity_type.manager')
    );
  }


  /**
   * Responds to GET requests.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request object.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   The response object.
   */
  public function get(Request $request) {
    // Get language from X-Language header or fall back to current language.
    $language_manager = \Drupal::languageManager();
    $requested_language = $request->headers->get('X-Language');
    $default_language = $language_manager->getDefaultLanguage();

    // Set the current language context based on the header.
    $current_language = $default_language;
    if ($requested_language) {
      $available_languages = $language_manager->getLanguages();
      if (isset($available_languages[$requested_language])) {
        $current_language = $available_languages[$requested_language];
        // Override the current language for this request.
        $language_manager->setConfigOverrideLanguage($current_language);
      }
      else {
        // If invalid language code is provided, return 400 error.
        $available_codes = array_keys($available_languages);
        $error_data = [
          'error' => 'Invalid language code',
          'message' => sprintf('Language code "%s" is not supported. Available languages: %s',
            $requested_language,
            implode(', ', $available_codes)
          ),
          'available_languages' => $available_codes,
        ];

        return $this->createModifiedResponse($error_data, 400);
      }
    }

    // Define the vocabularies used in the Application entity.
    $vocabularies = [
      'group_background' => [
        'label' => 'Group Background',
        'description' => 'Categories for group background types',
        'field_name' => 'group_background',
        'entity_type' => 'application',
        'cardinality' => 'multiple',
      ],
      'value_chain' => [
        'label' => 'Value Chain',
        'description' => 'Value chain categories for groups',
        'field_name' => 'value_chain',
        'entity_type' => 'application',
        'cardinality' => 'multiple',
      ],
      'purpose_of_the_loan' => [
        'label' => 'Purpose of the Loan',
        'description' => 'Purposes for which loans can be requested',
        'field_name' => 'purpose_of_loan',
        'entity_type' => 'application',
        'cardinality' => 'single',
        'auto_create' => TRUE,
      ],
      'loan_types' => [
        'label' => 'Loan Types',
        'description' => 'Types of loans available',
        'field_name' => 'loan_type',
        'entity_type' => 'application',
        'cardinality' => 'single',
      ],
      'banks' => [
        'label' => 'Banks',
        'description' => 'Available banks for account details',
        'field_name' => 'bank_name',
        'entity_type' => 'application',
        'cardinality' => 'single',
      ],
      'business_types' => [
        'label' => 'Business Types',
        'description' => 'Types of businesses',
        'field_name' => 'business_type',
        'entity_type' => 'application',
        'cardinality' => 'multiple',
      ],
      'position_of_member' => [
        'label' => 'Position of Member',
        'description' => 'Positions/roles of group members',
        'field_name' => 'position',
        'entity_type' => 'group_member',
        'cardinality' => 'single',
        'auto_create' => TRUE,
      ],
    ];

    // Get taxonomy term storage.
    $term_storage = $this->entityTypeManager->getStorage('taxonomy_term');
    $vocabulary_storage = $this->entityTypeManager->getStorage('taxonomy_vocabulary');

    $data = [];

    foreach ($vocabularies as $vocabulary_id => $vocabulary_info) {
      // Handle all vocabularies normally
      $vocabulary = $vocabulary_storage->load($vocabulary_id);

      if (!$vocabulary) {
        // If vocabulary doesn't exist, create a placeholder entry.
        $data[$vocabulary_id] = [
          'vocabulary_id' => $vocabulary_id,
          'vocabulary_label' => $vocabulary_info['label'],
          'vocabulary_description' => $vocabulary_info['description'],
          'field_name' => $vocabulary_info['field_name'],
          'entity_type' => $vocabulary_info['entity_type'],
          'cardinality' => $vocabulary_info['cardinality'],
          'auto_create' => $vocabulary_info['auto_create'] ?? FALSE,
          'terms' => [],
          'total_terms' => 0,
        ];
        continue;
      }

      // Load all terms for this vocabulary.
      $terms_query = $term_storage->getQuery()
        ->condition('vid', $vocabulary_id)
        ->condition('status', 1)
        ->sort('weight', 'ASC')
        ->sort('name', 'ASC')
        ->accessCheck(TRUE);

      $term_ids = $terms_query->execute();
      $terms = $term_storage->loadMultiple($term_ids);

      $terms_data = [];
      foreach ($terms as $term) {
        // Get the term in the requested language if available.
        if ($term->hasTranslation($current_language->getId())) {
          $term = $term->getTranslation($current_language->getId());
        }

        $terms_data[] = [
          'tid' => (int) $term->id(),
          'uuid' => $term->uuid(),
          'name' => $term->getName(),
          'description' => [
            'value' => $term->getDescription(),
            'format' => $term->get('description')->format,
            'processed' => $term->get('description')->processed,
          ],
          'weight' => (int) $term->getWeight(),
          'parent_ids' => array_map('intval', $term->get('parent')->getValue() ? array_column($term->get('parent')->getValue(), 'target_id') : []),
          'url' => $term->toUrl()->setAbsolute()->toString(),
          'language' => [
            'code' => $term->language()->getId(),
            'name' => $term->language()->getName(),
          ],
        ];
      }

      $data[$vocabulary_id] = [
        'vocabulary_id' => $vocabulary_id,
        'vocabulary_label' => $vocabulary->label(),
        'vocabulary_description' => $vocabulary->getDescription(),
        'field_name' => $vocabulary_info['field_name'],
        'entity_type' => $vocabulary_info['entity_type'],
        'cardinality' => $vocabulary_info['cardinality'],
        'auto_create' => $vocabulary_info['auto_create'] ?? FALSE,
        'terms' => $terms_data,
        'total_terms' => count($terms_data),
      ];
    }

    // Build available languages.
    $available_languages = [];
    foreach ($language_manager->getLanguages() as $langcode => $language) {
      $available_languages[$langcode] = [
        'langcode' => $langcode,
        'name' => $language->getName(),
        'url' => $request->getSchemeAndHttpHost() . $request->getPathInfo(),
        'path' => $request->getPathInfo(),
      ];
    }

    // Build the complete response with meta information.
    $response_data = [
      'data' => $data,
      'meta' => [
        'timestamp' => \Drupal::time()->getCurrentTime(),
        'version' => 'v1',
        'total_vocabularies' => count($data),
        'language' => [
          'current' => $current_language->getId(),
          'default' => $default_language->getId(),
          'available' => $available_languages,
        ],
      ],
    ];

    return $this->createModifiedResponse($response_data);
  }

}
