<?php

namespace Drupal\rest_framework\Plugin\rest\resource;

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\rest\ModifiedResourceResponse;
use Drupal\rest\Plugin\ResourceBase;
use Drupal\rest\ResourceResponse;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Provides a base resource for REST Framework endpoints.
 */
abstract class RestFrameworkResourceBase extends ResourceBase {

  /**
   * The path alias manager.
   *
   * @var \Drupal\path_alias\AliasManagerInterface
   */
  protected $aliasManager;

  /**
   * The field mapper service.
   *
   * @var \Drupal\rest_framework\Service\RestFrameworkFieldMapper
   */
  protected $fieldMapper;

  /**
   * The language manager.
   *
   * @var \Drupal\Core\Language\LanguageManagerInterface
   */
  protected $languageManager;

  /**
   * The path matcher.
   *
   * @var \Drupal\Core\Path\PathMatcherInterface
   */
  protected $pathMatcher;

  /**
   * Constructs a new RestFrameworkResourceBase object.
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
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition, $serializer_formats, $logger);
    $this->pathMatcher = $path_matcher;
    $this->fieldMapper = $field_mapper;
    $this->languageManager = $language_manager;
    $this->aliasManager = $alias_manager;
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
      $container->get('path_alias.manager')
    );
  }

  /**
   * Responds to OPTIONS requests.
   *
   * @return \Drupal\rest\ResourceResponse
   *   The response indicating allowed HTTP methods.
   */
  public function options() {
    $response = new ResourceResponse(NULL, 204);

    $response->headers->set('Access-Control-Allow-Origin', '*');
    $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, X-Language, X-Path');

    return $response;
  }

  /**
   * Maps entity data and builds response structure.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   The entity to map.
   * @param array $additional_meta
   *   Additional metadata to include in the response.
   *
   * @return array
   *   The structured response data.
   */
  protected function buildResponseData($entity, array $additional_meta = []): array {
    $data = $this->mapEntityData($entity);
    $translations = $this->getEntityTranslations($entity);

    return [
      'data' => $data,
      'meta' => array_merge([
        'timestamp' => time(),
        'version' => 'v1',
        'language' => [
          'current' => $entity->language()->getId(),
          'default' => $this->languageManager->getDefaultLanguage()->getId(),
          'available' => $translations,
        ],
      ], $additional_meta),
    ];
  }

  /**
   * Creates a modified response with no caching.
   *
   * @param mixed $data
   *   The response data.
   * @param int $status
   *   The response status code.
   * @param array $headers
   *   Array of response headers.
   *
   * @return \Drupal\rest\ModifiedResourceResponse
   *   The response object.
   */
  protected function createModifiedResponse($data = NULL, $status = 200, array $headers = []) {
    return new ModifiedResourceResponse($data, $status, $headers);
  }

  /**
   * Creates a response with proper cache metadata.
   *
   * @param mixed $data
   *   The response data.
   * @param \Drupal\Core\Entity\EntityInterface|null $entity
   *   The entity to extract cache metadata from.
   * @param int $status
   *   The response status code.
   * @param array $headers
   *   Array of response headers.
   *
   * @return \Drupal\rest\ResourceResponse
   *   The response object.
   */
  protected function createResponse($data = NULL, $entity = NULL, $status = 200, array $headers = []) {
    // Ensure status is always an integer.
    $status = is_numeric($status) ? (int) $status : 200;

    // Ensure we're passing the correct data structure.
    $response_data = NULL;

    if ($data instanceof EntityInterface) {
      // If data is an entity, map it first.
      $response_data = $this->buildResponseData($data);
      $entity = $data;
    }
    else {
      $response_data = $data;
    }

    // Create response with proper parameters.
    $response = new ResourceResponse($response_data, $status, $headers);

    // Get current request.
    $request = \Drupal::request();

    // Get the custom headers.
    $language_header = $request->headers->get('X-Language');
    $path_header = $request->headers->get('X-Path');

    // Create cache metadata.
    $cache_metadata = new CacheableMetadata();

    // Add essential cache contexts.
    $contexts = [
      'path_header',
      'language_header',
      'url.query_args',
      'url.site',
    ];

    $cache_metadata->addCacheContexts($contexts);

    // Extract and merge cache metadata from the entity.
    if ($entity instanceof EntityInterface) {
      // Add entity cache tags.
      $cache_metadata->addCacheTags($entity->getCacheTags());

      // Add entity cache contexts.
      $cache_metadata->addCacheContexts($entity->getCacheContexts());

      // Add entity cache max-age.
      $cache_metadata->mergeCacheMaxAge($entity->getCacheMaxAge());

      // Add cache tags for config entities the entity depends on.
      if ($entity->getEntityType()->getBundleEntityType()) {
        $cache_metadata->addCacheTags([
          'config:' . $entity->getEntityType()->getBundleEntityType(),
        ]);
      }

      // Add translation metadata if entity is translatable.
      if (method_exists($entity, 'isTranslatable') && $entity->isTranslatable()) {
        $cache_metadata->addCacheTags(['config:language.entity']);
        $cache_metadata->addCacheContexts(['languages:language_interface']);
      }

      // Add bundle-specific cache tags.
      $cache_metadata->addCacheTags([
        $entity->getEntityTypeId() . '_list',
        $entity->getEntityTypeId() . ':' . $entity->bundle(),
      ]);
    }

    // Add cache tags for translations if present in response data.
    if (!empty($response_data) && isset($response_data['meta']['language'])) {
      $cache_metadata->addCacheTags(['config:language.entity']);
    }

    // Add path-specific cache tag.
    if ($path_header) {
      $normalized_path = '/' . trim($path_header, '/');
      $cache_metadata->addCacheTags(['path:' . $normalized_path]);
    }

    // Set response headers.
    $response->headers->set('Content-Language', $language_header ?? 'en');

    // Set Vary headers - single string with all values.
    $response->headers->set('Vary', 'Accept, Accept-Encoding, X-Language, X-Path');

    // Set debug headers in development.
    if (getenv('APP_ENV') !== 'prod') {
      $response->headers->set('X-Debug-Path', $path_header ?? 'none');
      $response->headers->set('X-Debug-Language', $language_header ?? 'none');
      $response->headers->set('X-Cache-Tags', implode(', ', $cache_metadata->getCacheTags()));
      $response->headers->set('X-Cache-Contexts', implode(', ', $contexts));
      $response->headers->set('X-Cache-Keys', implode(', ', [
        'path:' . ($path_header ? '/' . trim($path_header, '/') : 'none'),
        'lang:' . ($language_header ?? 'none'),
      ]));
    }

    // Add cache dependency.
    $response->addCacheableDependency($cache_metadata);

    // If we have an entity, add it as a dependency too.
    if ($entity) {
      $response->addCacheableDependency($entity);
    }

    // Return $response.
    return $this->createModifiedResponse($response_data, $status, $headers);
  }

  /**
   * Gets available translations for an entity.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   The entity.
   *
   * @return array
   *   Array of translation information.
   */
  protected function getEntityTranslations($entity): array {
    $translations = [];
    $internal_path = '/' . $entity->getEntityTypeId() . '/' . $entity->id();

    foreach ($entity->getTranslationLanguages() as $language) {
      $lang_code = $language->getId();
      $translated_entity = $entity->getTranslation($lang_code);
      $alias = $this->aliasManager->getAliasByPath($internal_path, $lang_code);

      $translations[$lang_code] = [
        'langcode' => $lang_code,
        'name' => $language->getName(),
        'url' => $translated_entity->toUrl()->setAbsolute()->toString(),
        'path' => $alias,
      ];
    }

    return $translations;
  }

  /**
   * Gets the requested language from request.
   *
   * @return string
   *   The language code.
   */
  protected function getRequestedLanguage(): string {
    return \Drupal::request()->query->get('lang')
      ?? \Drupal::request()->headers->get('X-Language')
      ?? $this->languageManager->getDefaultLanguage()->getId();
  }

  /**
   * Maps entity data based on entity type.
   *
   * @param \Drupal\Core\Entity\ContentEntityInterface $entity
   *   The entity to map.
   *
   * @throws \Symfony\Component\HttpKernel\Exception\NotFoundHttpException
   *
   * @return array
   *   The mapped entity data.
   */
  protected function mapEntityData($entity): array {
    switch ($entity->getEntityTypeId()) {
      case 'node':
        return $this->fieldMapper->mapNodeData($entity);

      // Add support for other entity types as needed.
      default:
        throw new NotFoundHttpException('Unsupported content type');
    }
  }

  /**
   * Gets available languages.
   *
   * @return array
   *   Array of available languages.
   */
  protected function getAvailableLanguages() {
    $languages = $this->languageManager->getLanguages();
    $available = [];

    foreach ($languages as $langcode => $language) {
      $available[$langcode] = [
        'langcode' => $langcode,
        'name' => $language->getName(),
        'direction' => $language->getDirection(),
      ];
    }

    return $available;
  }

}
