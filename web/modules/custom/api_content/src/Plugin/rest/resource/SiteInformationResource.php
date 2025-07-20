<?php

namespace Drupal\api_content\Plugin\rest\resource;

use Drupal\rest_framework\Plugin\rest\resource\RestFrameworkResourceBase;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Path\PathMatcherInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\rest_framework\Service\RestFrameworkFieldMapper;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Psr\Log\LoggerInterface;

/**
 * Provides a resource to get site information and useful links.
 *
 * @RestResource(
 *   id = "site_information",
 *   label = @Translation("API Site Information"),
 *   uri_paths = {
 *     "canonical" = "/api/v1/site-info"
 *   }
 * )
 */
class SiteInformationResource extends RestFrameworkResourceBase {

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
   * Constructs a new SiteInformationResource object.
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
      $container->get('logger.factory')->get('api_content'),
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
   * @return \Drupal\rest\ResourceResponse
   *   The HTTP response object.
   */
  public function get() {
    // Get current language.
    $langcode = $this->getRequestedLanguage();

    // Get system site configuration.
    $site_config = $this->configFactory->get('system.site');

    // Get api_content configuration.
    $api_content_config = $this->configFactory->get('api_content.settings');
    $contact_info = $api_content_config->get('contact_info') ?? [];

    // Build the site information data.
    $data = [
      'site' => [
        'name' => $site_config->get('name'),
        'slogan' => $site_config->get('slogan'),
        'mail' => $site_config->get('mail'),
        'contact' => [
          'address' => $contact_info['address'] ?? '',
          'po_box' => $contact_info['po_box'] ?? '',
          'phone' => $contact_info['phone'] ?? '',
          'email' => $contact_info['email'] ?? '',
        ],
      ],
      'useful_links' => $this->getUsefulLinks(),
    ];

    // Build response with metadata.
    $response_data = [
      'data' => $data,
      'meta' => [
        'timestamp' => time(),
        'version' => 'v1',
        'language' => [
          'current' => $langcode,
          'default' => $this->languageManager->getDefaultLanguage()->getId(),
          'available' => $this->getAvailableLanguages(),
        ],
      ],
    ];

    // Use the parent class method to create response with proper caching.
    return $this->createResponse($response_data, NULL);
  }

  /**
   * Get useful links from the menu.
   *
   * @return array
   *   Array of useful links.
   */
  protected function getUsefulLinks() {
    $links = [];

    try {
      // Load menu links from the useful-links menu.
      $menu_link_content_storage = $this->entityTypeManager->getStorage('menu_link_content');
      $menu_links = $menu_link_content_storage->loadByProperties([
        'menu_name' => 'useful-links',
        'enabled' => TRUE,
      ]);

      // Sort by weight.
      uasort($menu_links, function ($a, $b) {
        return $a->getWeight() <=> $b->getWeight();
      });

      // Build the links array.
      foreach ($menu_links as $menu_link) {
        $url = $menu_link->getUrlObject();
        $links[] = [
          'id' => $menu_link->uuid(),
          'title' => $menu_link->getTitle(),
          'url' => $url->toString(),
          'weight' => $menu_link->getWeight(),
          'external' => $url->isExternal(),
        ];
      }
    }
    catch (\Exception $e) {
      $this->logger->error('Error loading useful links: @message', ['@message' => $e->getMessage()]);
    }

    return $links;
  }

}
