<?php

namespace Drupal\api_application\Plugin\rest\resource;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\rest_framework\Plugin\rest\resource\RestFrameworkResourceBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Psr\Log\LoggerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;

/**
 * Provides Application Instructions Resource.
 *
 * @RestResource(
 *   id = "application_instructions",
 *   label = @Translation("API Application Instructions"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/application/instructions"
 *   }
 * )
 */
class ApplicationInstructionsResource extends RestFrameworkResourceBase {

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
   * Constructs a new ApplicationInstructionsResource object.
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
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
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
    ConfigFactoryInterface $config_factory,
    EntityTypeManagerInterface $entity_type_manager,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger, $path_matcher, $field_mapper, $language_manager, $alias_manager);
    $this->configFactory = $config_factory;
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
      $container->get('config.factory'),
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
  public function get(Request $request): Response {
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

    // Load configuration in the requested language.
    $config = $this->configFactory->get('api_application.settings');
    $instructions = $config->get('instructions') ?? [];

    // Process body text with format.
    $body_value = $instructions['body']['value'] ?? '';
    $body_format = $instructions['body']['format'] ?? 'basic_html';
    $body_processed = $body_value;

    // Process the text if it has a format.
    if (!empty($body_value) && !empty($body_format)) {
      $build = [
        '#type' => 'processed_text',
        '#text' => $body_value,
        '#format' => $body_format,
      ];
      $body_processed = \Drupal::service('renderer')->renderPlain($build);
    }

    // Build the main data object.
    $data = [
      'id' => 'application_instructions',
      'type' => 'application_instructions',
      'title' => $instructions['title'] ?? '',
      'body' => [
        'value' => $body_value,
        'format' => $body_format,
        'processed' => (string) $body_processed,
      ],
      'documents_required' => [],
      'language' => [
        'code' => $current_language->getId(),
        'name' => $current_language->getName(),
        'direction' => $current_language->getDirection(),
      ],
      'url' => $request->getUri(),
    ];

    // Process documents required.
    if (!empty($instructions['documents_required'])) {
      $file_storage = $this->entityTypeManager->getStorage('file');

      foreach ($instructions['documents_required'] as $document) {
        // Process subtitle text with format.
        $subtitle_value = $document['subtitle']['value'] ?? '';
        $subtitle_format = $document['subtitle']['format'] ?? 'basic_html';
        $subtitle_processed = $subtitle_value;

        // Process the subtitle text if it has a format.
        if (!empty($subtitle_value) && !empty($subtitle_format)) {
          $build = [
            '#type' => 'processed_text',
            '#text' => $subtitle_value,
            '#format' => $subtitle_format,
          ];
          $subtitle_processed = \Drupal::service('renderer')->renderPlain($build);
        }

        $doc_data = [
          'title' => $document['title'] ?? '',
          'subtitle' => [
            'value' => $subtitle_value,
            'format' => $subtitle_format,
            'processed' => (string) $subtitle_processed,
          ],
          'link' => NULL,
          'example_images' => [],
          'examples_subtitle' => $document['examples_subtitle'] ?? '',
        ];

        // Process link if available.
        if (!empty($document['link']['uri'])) {
          $doc_data['link'] = [
            'uri' => $document['link']['uri'],
            'title' => $document['link']['title'] ?? '',
          ];
        }

        // Process example images.
        if (!empty($document['example_images'])) {
          foreach ($document['example_images'] as $image) {
            if (!empty($image['fid'])) {
              $file = $file_storage->load($image['fid']);
              if ($file) {
                $doc_data['example_images'][] = [
                  'fid' => $file->id(),
                  'filename' => $file->getFilename(),
                  'url' => $file->createFileUrl(FALSE),
                  'size' => $file->getSize(),
                  'mime_type' => $file->getMimeType(),
                ];
              }
            }
          }
        }

        $data['documents_required'][] = $doc_data;
      }
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
