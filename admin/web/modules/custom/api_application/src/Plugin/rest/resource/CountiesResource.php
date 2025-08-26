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
 * Provides Counties Resource for Application forms.
 *
 * @RestResource(
 *   id = "application_counties",
 *   label = @Translation("API Application Counties"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/application/counties"
 *   }
 * )
 */
class CountiesResource extends RestFrameworkResourceBase {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Constructs a new CountiesResource object.
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
   * {@inheritdoc}
   */
  public function permissions() {
    return [];
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

    $term_storage = $this->entityTypeManager->getStorage('taxonomy_term');
    $vocabulary_storage = $this->entityTypeManager->getStorage('taxonomy_vocabulary');
    
    $counties_vocabulary = $vocabulary_storage->load('counties');
    $constituencies_vocabulary = $vocabulary_storage->load('constituencies');

    if (!$counties_vocabulary) {
      return $this->createModifiedResponse([
        'error' => 'Counties vocabulary not found',
        'message' => 'The counties vocabulary has not been created or imported yet.',
      ], 404);
    }
    
    if (!$constituencies_vocabulary) {
      return $this->createModifiedResponse([
        'error' => 'Constituencies vocabulary not found',
        'message' => 'The constituencies vocabulary has not been created or imported yet.',
      ], 404);
    }

    // Get all county terms
    $counties_query = $term_storage->getQuery()
      ->condition('vid', 'counties')
      ->condition('status', 1)
      ->sort('weight', 'ASC')
      ->sort('name', 'ASC')
      ->accessCheck(TRUE);

    $county_term_ids = $counties_query->execute();
    $county_terms = $term_storage->loadMultiple($county_term_ids);
    
    // Get all constituency terms
    $constituencies_query = $term_storage->getQuery()
      ->condition('vid', 'constituencies')
      ->condition('status', 1)
      ->sort('name', 'ASC')
      ->accessCheck(TRUE);

    $constituency_term_ids = $constituencies_query->execute();
    $constituency_terms = $term_storage->loadMultiple($constituency_term_ids);

    // Build counties array
    $counties = [];
    $constituencies_by_parent = [];

    // Process county terms
    foreach ($county_terms as $county_term) {
      if ($county_term->hasTranslation($current_language->getId())) {
        $county_term = $county_term->getTranslation($current_language->getId());
      }

      $term_data = [
        'tid' => (int) $county_term->id(),
        'name' => $county_term->getName(),
        'constituencies' => [], // Will be populated below
      ];

      $counties[$county_term->id()] = $term_data;
    }
    
    // Process constituency terms and group by parent county
    foreach ($constituency_terms as $constituency_term) {
      if ($constituency_term->hasTranslation($current_language->getId())) {
        $constituency_term = $constituency_term->getTranslation($current_language->getId());
      }
      
      // Get the parent county reference
      $parent_county_field = $constituency_term->get('field_parent_county');
      $parent_county_id = null;
      
      if (!$parent_county_field->isEmpty()) {
        $parent_county_id = $parent_county_field->target_id;
      }

      $constituency_data = [
        'tid' => (int) $constituency_term->id(),
        'name' => $constituency_term->getName(),
      ];
      
      if ($parent_county_id && isset($counties[$parent_county_id])) {
        if (!isset($constituencies_by_parent[$parent_county_id])) {
          $constituencies_by_parent[$parent_county_id] = [];
        }
        $constituencies_by_parent[$parent_county_id][] = $constituency_data;
      }
    }

    // Add constituencies to their parent counties
    foreach ($constituencies_by_parent as $county_id => $constituencies) {
      if (isset($counties[$county_id])) {
        $counties[$county_id]['constituencies'] = $constituencies;
      }
    }

    // Build the complete response.
    $response_data = [
      'data' => array_values($counties), // Reset keys to be sequential
      'meta' => [
        'total_counties' => count($counties),
        'total_constituencies' => count($constituency_terms),
      ],
    ];

    return $this->createModifiedResponse($response_data);
  }

}