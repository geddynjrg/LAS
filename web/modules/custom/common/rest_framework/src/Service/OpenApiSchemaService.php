<?php

namespace Drupal\rest_framework\Service;

use Drupal\rest_framework\Plugin\ParagraphMapperInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Routing\RouteProviderInterface;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\rest_framework\Plugin\ParagraphMapperManager;
use Drupal\Core\Entity\EntityFieldManagerInterface;
use Drupal\Core\Entity\EntityTypeBundleInfoInterface;
use Drupal\rest_framework\Plugin\OpenApiSchemaProviderManager;
use Drupal\rest_framework\OpenApiSchemaProviderInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Service for generating OpenAPI 3.0 documentation.
 */
class OpenApiSchemaService {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * The cache backend.
   *
   * @var \Drupal\Core\Cache\CacheBackendInterface
   */
  protected $cache;

  /**
   * The route provider.
   *
   * @var \Drupal\Core\Routing\RouteProviderInterface
   */
  protected $routeProvider;

  /**
   * The paragraph mapper plugin manager.
   *
   * @var \Drupal\rest_framework\Plugin\ParagraphMapperManager
   */
  protected $pluginManager;

  /**
   * The entity field manager.
   *
   * @var \Drupal\Core\Entity\EntityFieldManagerInterface
   */
  protected $entityFieldManager;

  /**
   * The entity type bundle info.
   *
   * @var \Drupal\Core\Entity\EntityTypeBundleInfoInterface
   */
  protected $entityTypeBundleInfo;

  /**
   * The REST Framework field mapper service.
   *
   * @var \Drupal\rest_framework\Service\RestFrameworkFieldMapper
   */
  protected $fieldMapper;

  /**
   * The OpenAPI schema provider plugin manager.
   *
   * @var \Drupal\rest_framework\Plugin\OpenApiSchemaProviderManager
   */
  protected $schemaProviderManager;

  /**
   * The REST plugin manager.
   *
   * @var \Drupal\rest\Plugin\Type\ResourcePluginManager|null
   */
  protected $restPluginManager;

  /**
   * The container.
   *
   * @var \Symfony\Component\DependencyInjection\ContainerInterface
   */
  protected $container;

  /**
   * Schema providers.
   *
   * @var \Drupal\rest_framework\OpenApiSchemaProviderInterface[]
   */
  protected $schemaProviders = [];

  /**
   * Constructs a new OpenApiSchemaService object.
   */
  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    ConfigFactoryInterface $config_factory,
    CacheBackendInterface $cache,
    RouteProviderInterface $route_provider,
    ParagraphMapperManager $plugin_manager,
    EntityFieldManagerInterface $entity_field_manager,
    EntityTypeBundleInfoInterface $entity_type_bundle_info,
    RestFrameworkFieldMapper $field_mapper,
    OpenApiSchemaProviderManager $schema_provider_manager,
    ContainerInterface $container,
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->configFactory = $config_factory;
    $this->cache = $cache;
    $this->routeProvider = $route_provider;
    $this->pluginManager = $plugin_manager;
    $this->entityFieldManager = $entity_field_manager;
    $this->entityTypeBundleInfo = $entity_type_bundle_info;
    $this->fieldMapper = $field_mapper;
    $this->schemaProviderManager = $schema_provider_manager;
    $this->container = $container;

    // Get the REST plugin manager if it exists.
    if ($this->container->has('plugin.manager.rest')) {
      $this->restPluginManager = $this->container->get('plugin.manager.rest');
    }
  }

  /**
   * Generates the OpenAPI 3.0 specification.
   *
   * @return array
   *   The OpenAPI specification as an array.
   */
  public function generateOpenApiSpec() {
    // Disable caching for development to ensure changes are always visible.
    $useCache = FALSE;
    $cid = 'rest_framework:openapi_spec';

    if ($useCache && $cache = $this->cache->get($cid)) {
      return $cache->data;
    }

    $spec = [
      'openapi' => '3.0.0',
      'info' => [
        'title' => 'REST API',
        'version' => '1.0.0',
        'description' => 'API documentation for REST endpoints. This documentation shows all available endpoints with request/response structures and examples.',
        'contact' => [
          'name' => 'REST API Team',
          'email' => 'support@example.com',
        ],
        'license' => [
          'name' => 'MIT',
        ],
      ],
      'servers' => [
        [
          'url' => '',
          'description' => 'API v1',
        ],
      ],
      'tags' => [
        [
          'name' => 'Nodes',
          'description' => 'Content nodes endpoints',
        ],
        [
          'name' => 'Users',
          'description' => 'User-related endpoints',
        ],
        [
          'name' => 'Authentication',
          'description' => 'Authentication endpoints',
        ],
        [
          'name' => 'Resources',
          'description' => 'General REST resources',
        ],
      ],
      'paths' => [],
      'components' => [
        'schemas' => [],
        'securitySchemes' => [
          'bearerAuth' => [
            'type' => 'http',
            'scheme' => 'bearer',
            'bearerFormat' => 'JWT',
            'description' => 'JWT Bearer token authentication',
          ],
        ],
      ],
      'security' => [
        ['bearerAuth' => []],
      ],
    ];

    // Add endpoints from schema providers.
    $this->addProvidedEndpoints($spec);

    // Add only node entity schemas.
    $this->addNodeSchemas($spec);

    // Add paragraph schemas.
    $this->addParagraphSchemas($spec);

    // Add example responses.
    $this->addExampleResponses($spec);

    // Add Zod schema information.
    $this->addZodSchemaInfo($spec);

    if ($useCache) {
      // Set a short cache time for development.
      $this->cache->set($cid, $spec, time() + 300);
    }

    return $spec;
  }

  /**
   * Maps a route to a tag for grouping in the documentation.
   *
   * @param string $path
   *   The route path.
   * @param string $route_name
   *   The route name.
   *
   * @return string[]
   *   The tags to associate with this route.
   */
  protected function getTagsForRoute($path, $route_name) {
    // Categorize by path pattern.
    if (strpos($path, '/api/v1/node') === 0) {
      return ['Nodes'];
    }
    elseif (strpos($path, '/api/v1/user/login') === 0 ||
            strpos($path, '/api/v1/user/register') === 0 ||
            strpos($path, '/api/v1/user/password') === 0) {
      return ['Authentication'];
    }
    elseif (strpos($path, '/api/v1/user') === 0) {
      return ['Users'];
    }

    // Default tag.
    return ['API Resources'];
  }

  /**
   * Adds REST resource paths.
   *
   * @param array &$spec
   *   The OpenAPI specification array.
   */
  protected function addRestResourcePaths(array &$spec) {
    // Get all possible REST routes - instead of just limiting to /api/v1.
    $routes = [];

    // Method 1: Get routes with /api/v1 pattern.
    $apiRoutes = $this->routeProvider->getRoutesByPattern('/api/v1');
    foreach ($apiRoutes as $name => $route) {
      $routes[$name] = $route;
    }

    // Method 2: Discover plugin-based REST resources.
    try {
      // Look for REST resources defined by plugins.
      if ($this->restPluginManager) {
        $restDefinitions = $this->restPluginManager->getDefinitions();

        foreach ($restDefinitions as $definition) {
          if (isset($definition['uri_paths'])) {
            // For each URI path, try to find the corresponding route.
            foreach ($definition['uri_paths'] as $path) {
              // Convert the URI path to a route pattern.
              $pattern = strpos($path, '/') === 0 ? $path : '/' . $path;
              $routeMatches = $this->routeProvider->getRoutesByPattern($pattern);

              foreach ($routeMatches as $routeName => $route) {
                // Add to our collection of routes to process.
                $routes[$routeName] = $route;
              }
            }
          }
        }
      }
    }
    catch (\Exception $e) {
      // Log but proceed anyway.
      $this->container->get('logger.factory')->get('rest_framework')->error('Error discovering REST resources: @message', [
        '@error' => $e->getMessage(),
      ]);
    }

    // Now process all discovered routes.
    foreach ($routes as $route_name => $route) {
      // Skip non-API and system routes.
      if (strpos($route_name, 'rest_framework') !== 0 &&
          strpos($route_name, 'rest.') !== 0 &&
          strpos($route_name, 'jsonapi.') !== 0 &&
          !preg_match('/\.(json|xml)$/', $route_name)) {
        continue;
      }

      $path = $route->getPath();

      // Get methods - if no methods defined, try to infer from route name.
      $methods = $route->getMethods();
      if (empty($methods)) {
        // Try to infer HTTP method from route name.
        if (strpos($route_name, '.GET.') !== FALSE) {
          $methods = ['GET'];
        }
        elseif (strpos($route_name, '.POST.') !== FALSE) {
          $methods = ['POST'];
        }
        elseif (strpos($route_name, '.PATCH.') !== FALSE) {
          $methods = ['PATCH'];
        }
        elseif (strpos($route_name, '.DELETE.') !== FALSE) {
          $methods = ['DELETE'];
        }
        else {
          // Default to GET if we can't determine.
          $methods = ['GET'];
        }
      }

      // Get appropriate tags for this route.
      $tags = $this->getTagsForRoute($path, $route_name);

      foreach ($methods as $method) {
        $method_lower = strtolower($method);

        // Skip OPTIONS method as it's used for CORS preflight.
        if ($method_lower === 'options') {
          continue;
        }

        // Generate a better summary and description based on the route.
        $summary = $this->generateSummary($path, $method_lower, $route->getDefault('_title'));
        $description = $this->generateDescription($path, $method_lower, $route->getDefault('_description'));

        $operation = [
          'summary' => $summary,
          'description' => $description,
          'operationId' => $route_name,
          'responses' => [
            '200' => [
              'description' => 'Successful response',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/RestFrameworkResponse',
                  ],
                ],
              ],
            ],
            '401' => [
              'description' => 'Unauthorized - Authentication is required',
            ],
            '403' => [
              'description' => 'Forbidden - Insufficient permissions',
            ],
            '404' => [
              'description' => 'Not found - The requested resource does not exist',
            ],
          ],
          'tags' => $tags,
        ];

        // Add request body for POST and PATCH methods.
        if (in_array($method_lower, ['post', 'patch'])) {
          $operation['requestBody'] = [
            'required' => TRUE,
            'content' => [
              'application/json' => [
                'schema' => [
                  '$ref' => '#/components/schemas/RequestBody',
                ],
              ],
            ],
          ];
        }

        // Add parameters for path variables.
        $parameters = [];
        if (preg_match_all('/{([^}]+)}/', $path, $matches)) {
          foreach ($matches[1] as $name) {
            $parameters[] = [
              'name' => $name,
              'in' => 'path',
              'required' => TRUE,
              'schema' => [
                'type' => 'string',
              ],
              'description' => $this->generateParameterDescription($name, $path),
            ];
          }
          $operation['parameters'] = $parameters;
        }

        $spec['paths'][$path][$method_lower] = $operation;
      }
    }

    // Add RestFrameworkResourceBase response schema structure.
    $spec['components']['schemas']['RestFrameworkResponse'] = [
      'type' => 'object',
      'properties' => [
        'data' => [
          'type' => 'object',
          'description' => 'The response data',
          'oneOf' => [
            ['$ref' => '#/components/schemas/NodeResponse'],
            ['$ref' => '#/components/schemas/NodeListResponse'],
          ],
        ],
        'meta' => [
          'type' => 'object',
          'properties' => [
            'timestamp' => [
              'type' => 'integer',
              'description' => 'Unix timestamp of when the response was generated',
              'example' => time(),
            ],
            'version' => [
              'type' => 'string',
              'description' => 'API version',
              'example' => 'v1',
            ],
            'language' => [
              'type' => 'object',
              'properties' => [
                'current' => [
                  'type' => 'string',
                  'description' => 'Current language code',
                  'example' => 'en',
                ],
                'default' => [
                  'type' => 'string',
                  'description' => 'Default language code',
                  'example' => 'en',
                ],
                'available' => [
                  'type' => 'object',
                  'additionalProperties' => [
                    'type' => 'object',
                    'properties' => [
                      'langcode' => [
                        'type' => 'string',
                        'example' => 'en',
                      ],
                      'name' => [
                        'type' => 'string',
                        'example' => 'English',
                      ],
                      'url' => [
                        'type' => 'string',
                        'example' => 'https://example.com/node/1',
                      ],
                      'path' => [
                        'type' => 'string',
                        'example' => '/about-us',
                      ],
                    ],
                  ],
                  'description' => 'Available language translations',
                ],
              ],
            ],
          ],
          'required' => ['timestamp', 'version', 'language'],
        ],
      ],
      'required' => ['data', 'meta'],
    ];

    // Create base node response schema based on
    // RestFrameworkFieldMapper::mapNodeData.
    $spec['components']['schemas']['NodeResponse'] = [
      'type' => 'object',
      'properties' => [
        'id' => [
          'type' => 'integer',
          'description' => 'The node ID',
          'example' => 1,
        ],
        'type' => [
          'type' => 'string',
          'description' => 'The node bundle (content type)',
          'example' => 'page',
        ],
        'uuid' => [
          'type' => 'string',
          'description' => 'The node UUID',
          'example' => '550e8400-e29b-41d4-a716-446655440000',
        ],
        'title' => [
          'type' => 'string',
          'description' => 'The node title',
          'example' => 'Example Page',
        ],
        'language' => [
          'type' => 'object',
          'properties' => [
            'code' => [
              'type' => 'string',
              'example' => 'en',
            ],
            'name' => [
              'type' => 'string',
              'example' => 'English',
            ],
            'direction' => [
              'type' => 'string',
              'example' => 'ltr',
            ],
          ],
        ],
        'url' => [
          'type' => 'string',
          'description' => 'The absolute URL to the node',
          'example' => 'https://example.com/node/1',
        ],
        'path_alias' => [
          'type' => 'string',
          'description' => 'The path alias of the node',
          'example' => '/about-us',
        ],
        'content' => [
          'type' => 'object',
          'description' => 'The node content fields',
          'additionalProperties' => TRUE,
        ],
      ],
      'required' => ['id', 'type', 'uuid', 'title', 'url', 'path_alias', 'content'],
    ];
    // Create node list response schema.
    $spec['components']['schemas']['NodeListResponse'] = [
      'type' => 'object',
      'properties' => [
        'type' => [
          'type' => 'string',
          'example' => 'course_list',
        ],
        'courses' => [
          'type' => 'array',
          'items' => [
            '$ref' => '#/components/schemas/NodeResponse',
          ],
        ],
      ],
      'required' => ['type', 'courses'],
    ];

    $spec['components']['schemas']['RequestBody'] = [
      'type' => 'object',
      'properties' => [
        'data' => [
          'type' => 'object',
          'description' => 'The request data',
        ],
      ],
      'required' => ['data'],
    ];
  }

  /**
   * Generates a summary for a route.
   *
   * @param string $path
   *   The route path.
   * @param string $method
   *   The HTTP method.
   * @param string|null $title
   *   The route title, if available.
   *
   * @return string
   *   A human-readable summary.
   */
  protected function generateSummary($path, $method, $title = NULL) {
    if ($title) {
      return $title;
    }

    // Extract the last part of the path for a more readable name.
    $parts = explode('/', trim($path, '/'));
    $last_part = end($parts);

    // Handle path parameters.
    if (preg_match('/^\{(.+)\}$/', $last_part, $matches)) {
      $entity_type = $parts[count($parts) - 2] ?? 'resource';
      $param_name = $matches[1];

      switch ($method) {
        case 'get':
          return "Retrieve a specific $entity_type by $param_name";

        case 'post':
          return "Create a new $entity_type";

        case 'patch':
          return "Update a specific $entity_type by $param_name";

        case 'delete':
          return "Delete a specific $entity_type by $param_name";

        default:
          return ucfirst($method) . " " . $entity_type;
      }
    }

    // Regular endpoints.
    switch ($method) {
      case 'get':
        return "Retrieve $last_part information";

      case 'post':
        return "Create a new $last_part";

      case 'patch':
        return "Update $last_part information";

      case 'delete':
        return "Delete $last_part";

      default:
        return ucfirst($method) . " " . $last_part;
    }
  }

  /**
   * Generates a description for a route.
   *
   * @param string $path
   *   The route path.
   * @param string $method
   *   The HTTP method.
   * @param string|null $description
   *   The route description, if available.
   *
   * @return string
   *   A human-readable description.
   */
  protected function generateDescription($path, $method, $description = NULL) {
    if ($description) {
      return $description;
    }

    // Extract meaningful parts from the path.
    $parts = explode('/', trim($path, '/'));
    $entity_type = $parts[2] ?? 'resource';

    $descriptions = [
      'get' => "Returns detailed information about the $entity_type. The response will include all available fields and relationships.",
      'post' => "Create a new $entity_type with the provided data. Required fields must be included in the request.",
      'patch' => "Update an existing $entity_type with the provided data. Only specified fields will be updated.",
      'delete' => "Permanently delete the specified $entity_type. This action cannot be undone.",
    ];

    return $descriptions[$method] ?? "Perform $method operation on $entity_type.";
  }

  /**
   * Generates a description for a path parameter.
   *
   * @param string $name
   *   The parameter name.
   * @param string $path
   *   The route path.
   *
   * @return string
   *   A human-readable description.
   */
  protected function generateParameterDescription($name, $path) {
    if ($name === 'id') {
      // Determine the entity type from the path.
      if (strpos($path, '/node/') !== FALSE) {
        return 'The unique Node ID or path alias';
      }
      if (strpos($path, '/user/') !== FALSE) {
        return 'The unique User ID';
      }
      return 'The unique resource identifier';
    }

    if ($name === 'type') {
      return 'The bundle or type identifier';
    }

    if ($name === 'uuid') {
      return 'The universal unique identifier (UUID)';
    }

    // Default description.
    return "The $name identifier";
  }

  /**
   * Adds schemas for node entities.
   *
   * @param array &$spec
   *   The OpenAPI specification array.
   */
  protected function addNodeSchemas(array &$spec) {
    // Get all node bundles.
    $node_bundles = $this->entityTypeBundleInfo->getBundleInfo('node');

    foreach ($node_bundles as $bundle_id => $bundle_info) {
      $schema_key = 'Node' . $this->camelize($bundle_id);
      $spec['components']['schemas'][$schema_key] = $this->generateNodeBundleSchema($bundle_id);
    }
  }

  /**
   * Generates schema for a node bundle.
   *
   * @param string $bundle_id
   *   The node bundle ID.
   *
   * @return array
   *   The node bundle schema.
   */
  protected function generateNodeBundleSchema($bundle_id) {
    // Create base node schema.
    $schema = [
      'type' => 'object',
      'properties' => [
        'id' => [
          'type' => 'integer',
          'example' => 123,
        ],
        'type' => [
          'type' => 'string',
          'example' => $bundle_id,
        ],
        'uuid' => [
          'type' => 'string',
          'example' => '550e8400-e29b-41d4-a716-446655440000',
        ],
        'title' => [
          'type' => 'string',
          'example' => 'Example Node Title',
        ],
        'language' => [
          'type' => 'object',
          'properties' => [
            'code' => [
              'type' => 'string',
              'example' => 'en-gb',
            ],
            'name' => [
              'type' => 'string',
              'example' => 'English, British',
            ],
            'direction' => [
              'type' => 'string',
              'example' => 'ltr',
            ],
          ],
        ],
        'url' => [
          'type' => 'string',
          'example' => 'https://example.com/node/123',
        ],
        'path_alias' => [
          'type' => 'string',
          'example' => '/example-node',
        ],
        'content' => [
          'type' => 'object',
          'properties' => [],
        ],
      ],
      'required' => ['id', 'type', 'uuid', 'title', 'language', 'url', 'path_alias', 'content', 'meta'],
    ];

    // Get field definitions for this bundle.
    $field_definitions = $this->entityFieldManager->getFieldDefinitions('node', $bundle_id);

    // Add each field to the schema.
    foreach ($field_definitions as $field_name => $field_definition) {
      // Skip system fields.
      if ($this->isSystemField($field_name)) {
        continue;
      }

      // Clean field name using the field mapper service.
      $clean_name = $this->fieldMapper->cleanFieldName($field_name);

      // Special case for paragraph reference fields.
      if ($field_definition->getType() === 'entity_reference' || $field_definition->getType() === 'entity_reference_revisions') {
        if ($field_definition->getSetting('target_type') === 'paragraph') {
          $schema['properties']['content']['properties'][$clean_name] = [
            'type' => 'array',
            'items' => [
              'oneOf' => $this->getParagraphReferences($bundle_id),
            ],
          ];
          continue;
        }
      }

      // Add field schema.
      $schema['properties']['content']['properties'][$clean_name] = $this->getFieldSchema($field_definition, $bundle_id);

      // Add to required fields if needed.
      if ($field_definition->isRequired()) {
        $schema['properties']['content']['required'][] = $clean_name;
      }
    }

    return $schema;
  }

  /**
   * Adds schemas for all paragraph types.
   *
   * @param array &$spec
   *   The OpenAPI specification array.
   */
  protected function addParagraphSchemas(array &$spec) {
    // Get all paragraph plugins from the plugin manager.
    $plugins = $this->pluginManager->getDefinitions();

    foreach ($plugins as $plugin_id => $plugin) {
      $schema_key = 'Paragraph' . ucfirst($plugin_id);
      $spec['components']['schemas'][$schema_key] = $this->generateSchemaForParagraphPlugin($plugin_id, $plugin);
    }
  }

  /**
   * Generates schema for a paragraph plugin.
   *
   * @param string $plugin_id
   *   The plugin ID.
   * @param array $plugin
   *   The plugin definition.
   *
   * @return array
   *   The schema array.
   */
  protected function generateSchemaForParagraphPlugin($plugin_id, array $plugin) {
    $schema = [
      'type' => 'object',
      'title' => $plugin['label'],
      'description' => $plugin['description'] ?? 'Paragraph of type ' . $plugin['paragraph_type'],
      'properties' => [
        'block_type' => [
          'type' => 'string',
          'description' => 'The block type identifier',
          'example' => $plugin['paragraph_type'],
        ],
      ],
      'required' => ['block_type'],
    ];

    // Create an instance of the plugin to get its field mapping and example.
    try {
      $mapper = $this->pluginManager->createInstance($plugin_id);

      // First, try to get the OpenAPI example from the mapper.
      if ($mapper instanceof ParagraphMapperInterface && method_exists($mapper, 'getOpenApiExample')) {
        $example = $mapper->getOpenApiExample();

        if ($example !== NULL && isset($example['block_type']) && $example['block_type'] === $plugin['paragraph_type']) {
          // Use the example to generate a more accurate schema.
          $schema['example'] = $example;

          // Extract properties from the example.
          foreach ($example as $key => $value) {
            if ($key !== 'block_type') {
              $schema['properties'][$key] = $this->generateSchemaFromExample($value);
            }
          }

          // If we have a complete example, we can return the schema now.
          // More than just block_type.
          if (count($schema['properties']) > 1) {
            return $schema;
          }
        }
      }

      // If we can instantiate the mapper plugin, we can use its field mapping.
      if ($mapper && method_exists($mapper, 'getFieldMapping')) {
        $field_mapping = $mapper->getFieldMapping();

        foreach ($field_mapping as $field_name => $mapping) {
          // Skip system fields.
          if ($this->isSystemField($field_name)) {
            continue;
          }

          $clean_name = $this->fieldMapper->cleanFieldName($field_name);

          $schema['properties'][$clean_name] = $this->generateSchemaForMappedField($mapping);

          // Add to required fields if necessary.
          if (!empty($mapping['required'])) {
            $schema['required'][] = $clean_name;
          }
        }
      }
    }
    catch (\Exception $e) {
      // Fallback to using entity field definitions.
      $field_definitions = $this->entityFieldManager->getFieldDefinitions('paragraph', $plugin['paragraph_type']);

      foreach ($field_definitions as $field_name => $field_definition) {
        // Skip system fields.
        if ($this->isSystemField($field_name)) {
          continue;
        }

        $clean_name = $this->fieldMapper->cleanFieldName($field_name);

        $field_schema = $this->getFieldSchema($field_definition);
        if ($field_schema) {
          $schema['properties'][$clean_name] = $field_schema;

          if ($field_definition->isRequired()) {
            $schema['required'][] = $clean_name;
          }
        }
      }
    }

    return $schema;
  }

  /**
   * Generates a schema from an example value.
   *
   * @param mixed $value
   *   The example value.
   *
   * @return array
   *   The schema for the example value.
   */
  protected function generateSchemaFromExample($value) {
    $schema = [];

    if (is_array($value)) {
      if (array_keys($value) === range(0, count($value) - 1)) {
        // This is a sequential array (list)
        $schema['type'] = 'array';
        $schema['items'] = $this->generateSchemaFromExample($value[0] ?? NULL);
      }
      else {
        // This is an associative array (object)
        $schema['type'] = 'object';
        $schema['properties'] = [];

        foreach ($value as $key => $val) {
          $schema['properties'][$key] = $this->generateSchemaFromExample($val);
        }
      }
    }
    else {
      // This is a scalar value.
      if (is_bool($value)) {
        $schema['type'] = 'boolean';
      }
      elseif (is_int($value)) {
        $schema['type'] = 'integer';
      }
      elseif (is_float($value)) {
        $schema['type'] = 'number';
      }
      else {
        $schema['type'] = 'string';
      }

      $schema['example'] = $value;
    }

    return $schema;
  }

  /**
   * Generates schema for a mapped field from paragraph mapper.
   *
   * @param array $mapping
   *   The field mapping array.
   *
   * @return array
   *   Schema for the mapped field.
   */
  protected function generateSchemaForMappedField(array $mapping) {
    $schema = [
      'type' => $mapping['type'] ?? 'string',
      'description' => $mapping['description'] ?? '',
    ];

    // Add examples if available.
    if (isset($mapping['example'])) {
      $schema['example'] = $mapping['example'];
    }

    // Handle nested objects.
    if (isset($mapping['properties'])) {
      $schema['properties'] = [];

      foreach ($mapping['properties'] as $prop => $propMapping) {
        $schema['properties'][$prop] = $this->generateSchemaForMappedField($propMapping);
      }
    }

    // Handle arrays.
    if ($schema['type'] === 'array' && isset($mapping['items'])) {
      $schema['items'] = $this->generateSchemaForMappedField($mapping['items']);
    }

    return $schema;
  }

  /**
   * Checks if a field is a system field that should be excluded.
   *
   * @param string $field_name
   *   The field name.
   *
   * @return bool
   *   TRUE if it is a system field.
   */
  protected function isSystemField($field_name) {
    // Node entity system fields.
    $node_system_fields = [
      'nid', 'id', 'uuid', 'vid', 'type', 'langcode', 'revision_timestamp',
      'revision_uid', 'revision_log', 'uid', 'status', 'title',
      'created', 'changed', 'promote', 'sticky', 'default_langcode',
      'revision_translation_affected', 'path', 'content_translation_source',
      'content_translation_outdated', 'content_translation_status',
      'menu_link', 'parent', 'weight', 'expanded', 'hidden',
      'default_langcode', 'revision_default', 'revision_translation_affected',
      'revision_id', 'revision_uid', 'revision_log', 'status', 'created',
      'changed',
    ];

    return in_array($field_name, $node_system_fields);
  }

  /**
   * Determines if an entity type should be included in the schema.
   *
   * @param \Drupal\Core\Entity\EntityTypeInterface $entity_type
   *   The entity type.
   *
   * @return bool
   *   TRUE if the entity type should be included.
   */
  protected function shouldIncludeEntityType(EntityTypeInterface $entity_type) {
    // Include only content entity types that have REST support.
    return $entity_type->entityClassImplements('Drupal\Core\Entity\ContentEntityInterface') &&
           $entity_type->hasLinkTemplate('canonical');
  }

  /**
   * Generates schema for a specific bundle.
   *
   * @param string $entity_type
   *   The entity type.
   * @param string $bundle
   *   The bundle name.
   *
   * @return array
   *   The schema array.
   */
  protected function generateSchemaForBundle($entity_type, $bundle) {
    $schema = [
      'type' => 'object',
      'properties' => [],
      'required' => [],
    ];

    // Get field definitions.
    $field_definitions = $this->entityFieldManager->getFieldDefinitions($entity_type, $bundle);

    foreach ($field_definitions as $field_name => $field_definition) {
      $schema['properties'][$field_name] = $this->getFieldSchema($field_definition);

      if ($field_definition->isRequired()) {
        $schema['required'][] = $field_name;
      }
    }

    // Add common entity properties.
    $schema['properties']['uuid'] = [
      'type' => 'string',
      'description' => 'The UUID of the entity.',
      'example' => '550e8400-e29b-41d4-a716-446655440000',
    ];
    $schema['properties']['created'] = [
      'type' => 'string',
      'format' => 'date-time',
      'description' => 'The time that the entity was created.',
      'example' => '2023-04-01T12:00:00Z',
    ];
    $schema['properties']['changed'] = [
      'type' => 'string',
      'format' => 'date-time',
      'description' => 'The time that the entity was last changed.',
      'example' => '2023-04-02T14:30:00Z',
    ];

    return $schema;
  }

  /**
   * Gets schema for a specific field with examples.
   *
   * @param \Drupal\Core\Field\FieldDefinitionInterface $field_definition
   *   The field definition.
   * @param string|null $node_bundle
   *   Optional node bundle to filter paragraph references.
   *
   * @return array
   *   The field schema.
   */
  protected function getFieldSchema($field_definition, $node_bundle = NULL) {
    $field_type = $field_definition->getType();
    $schema = [
      'type' => $this->getFieldType($field_definition),
      'description' => $field_definition->getDescription() ?: $field_definition->getLabel(),
    ];

    // Add examples based on - following
    // RestFrameworkFieldMapper::mapFieldByType structure.
    switch ($field_type) {
      case 'text':
      case 'string':
      case 'string_long':
        $schema['example'] = 'Example text content';
        break;

      case 'text_long':
      case 'text_with_summary':
        $schema['type'] = 'object';
        $schema['properties'] = [
          'value' => [
            'type' => 'string',
            'example' => '<p>Example formatted text content</p>',
          ],
          'format' => [
            'type' => 'string',
            'example' => 'full_html',
          ],
          'processed' => [
            'type' => 'string',
            'example' => '<p>Example formatted text content</p>',
          ],
        ];
        break;

      case 'integer':
        $schema['example'] = 42;
        break;

      case 'decimal':
      case 'float':
        $schema['example'] = 3.14;
        break;

      case 'boolean':
        $schema['example'] = TRUE;
        break;

      case 'email':
        $schema['example'] = 'example@example.com';
        break;

      case 'telephone':
        $schema['example'] = '+1234567890';
        break;

      case 'datetime':
        $schema['type'] = 'array';
        $schema['items'] = [
          'type' => 'string',
          'example' => '2023-04-01T12:00:00+00:00',
        ];
        break;

      case 'link':
        $schema['type'] = 'array';
        $schema['items'] = [
          'type' => 'object',
          'properties' => [
            'title' => [
              'type' => 'string',
              'example' => 'Example Link',
            ],
            'url' => [
              'type' => 'string',
              'example' => 'https://example.com',
            ],
            'options' => [
              'type' => 'object',
              'example' => [],
            ],
          ],
        ];
        break;

      case 'image':
        $schema['type'] = 'array';
        $schema['items'] = [
          'type' => 'object',
          'properties' => [
            'url' => [
              'type' => 'string',
              'example' => 'https://example.com/sites/default/files/image.jpg',
            ],
            'alt' => [
              'type' => 'string',
              'example' => 'Alternative text',
            ],
            'title' => [
              'type' => 'string',
              'example' => 'Image title',
            ],
            'width' => [
              'type' => 'integer',
              'example' => 800,
            ],
            'height' => [
              'type' => 'integer',
              'example' => 600,
            ],
            'mime' => [
              'type' => 'string',
              'example' => 'image/jpeg',
            ],
            'size' => [
              'type' => 'integer',
              'example' => 102400,
            ],
          ],
        ];
        break;

      case 'entity_reference':
        if ($field_definition->getSetting('target_type') === 'paragraph') {
          $schema['type'] = 'array';
          $schema['items'] = [
            'oneOf' => $this->getParagraphReferences($node_bundle),
          ];
        }
        elseif ($field_definition->getSetting('target_type') === 'node') {
          $schema['type'] = 'array';
          $schema['example'] = [
            [
              'id' => 123,
              'type' => 'page',
              'uuid' => '550e8400-e29b-41d4-a716-446655440000',
              'title' => 'Referenced Node',
              'path_alias' => '/referenced-node',
            ],
          ];
        }
        elseif ($field_definition->getSetting('target_type') === 'taxonomy_term') {
          $schema['type'] = 'array';
          $schema['example'] = ['Term name 1', 'Term name 2'];
        }
        elseif ($field_definition->getSetting('target_type') === 'media') {
          $schema['type'] = 'array';
          $schema['example'] = [
            [
              'id' => 123,
              'type' => 'media',
              'bundle' => 'image',
              'name' => 'Example media',
              'uuid' => '550e8400-e29b-41d4-a716-446655440000',
              'url' => 'https://example.com/sites/default/files/media.jpg',
              'mime_type' => 'image/jpeg',
              'size' => 102400,
              'alt' => 'Alternative text',
              'title' => 'Media title',
            ],
          ];
        }
        else {
          $schema['type'] = 'array';
          $schema['example'] = [
            [
              'id' => 123,
              'type' => $field_definition->getSetting('target_type'),
              'bundle' => 'default',
              'uuid' => '550e8400-e29b-41d4-a716-446655440000',
              'label' => 'Referenced Entity',
              'url' => 'https://example.com/entity/123',
            ],
          ];
        }
        break;

      case 'entity_reference_revisions':
        if ($field_definition->getSetting('target_type') === 'paragraph') {
          $schema['type'] = 'array';
          $schema['items'] = [
            'oneOf' => $this->getParagraphReferences($node_bundle),
          ];
        }
        break;

      case 'address':
        $schema['type'] = 'object';
        $schema['properties'] = [
          'country_code' => [
            'type' => 'string',
            'example' => 'US',
          ],
          'administrative_area' => [
            'type' => 'string',
            'example' => 'CA',
          ],
          'locality' => [
            'type' => 'string',
            'example' => 'San Francisco',
          ],
          'dependent_locality' => [
            'type' => 'string',
            'example' => '',
          ],
          'postal_code' => [
            'type' => 'string',
            'example' => '94107',
          ],
          'address_line' => [
            'type' => 'string',
            'example' => '123 Main St',
          ],
          'organization' => [
            'type' => 'string',
            'example' => 'Example Company',
          ],
        ];
        break;

      case 'geofield':
        $schema['type'] = 'object';
        $schema['properties'] = [
          'latitude' => [
            'type' => 'number',
            'format' => 'float',
            'example' => 37.7749,
          ],
          'longitude' => [
            'type' => 'number',
            'format' => 'float',
            'example' => -122.4194,
          ],
        ];
        break;
    }

    // Add enum values if field has allowed values.
    if ($field_definition->getSetting('allowed_values')) {
      $schema['enum'] = array_keys($field_definition->getSetting('allowed_values'));
    }

    return $schema;
  }

  /**
   * Gets references to all paragraph schemas.
   *
   * @param string|null $node_bundle
   *   Optional node bundle to filter paragraph references.
   *
   * @return array
   *   Array of paragraph schema references.
   */
  protected function getParagraphReferences($node_bundle = NULL) {
    $references = [];

    // Get all paragraph plugins from the plugin manager.
    $plugins = $this->pluginManager->getDefinitions();

    foreach ($plugins as $plugin_id => $plugin) {
      // If a node bundle is specified, check if this paragraph type is used
      // in that bundle.
      if ($node_bundle !== NULL) {
        // Get field definitions for the node bundle.
        $field_definitions = $this->entityFieldManager->getFieldDefinitions('node', $node_bundle);

        $is_used = FALSE;
        foreach ($field_definitions as $field_definition) {
          // Check if this is a paragraph reference field.
          if ($field_definition->getType() === 'entity_reference_revisions' &&
              $field_definition->getSetting('target_type') === 'paragraph') {

            // Check if this paragraph type is allowed in this field.
            $handler_settings = $field_definition->getSetting('handler_settings');
            if (isset($handler_settings['target_bundles'])) {
              if (empty($handler_settings['target_bundles']) ||
                  in_array($plugin['paragraph_type'], $handler_settings['target_bundles'])) {
                $is_used = TRUE;
                break;
              }
            }
          }
        }

        // Skip if this paragraph type is not used in the specified node bundle.
        if (!$is_used) {
          continue;
        }
      }

      $references[] = [
        '$ref' => '#/components/schemas/Paragraph' . ucfirst($plugin_id),
      ];
    }

    return $references;
  }

  /**
   * Gets OpenAPI type for a field.
   *
   * @param \Drupal\Core\Field\FieldDefinitionInterface $field_definition
   *   The field definition.
   *
   * @return string
   *   The OpenAPI type.
   */
  protected function getFieldType($field_definition) {
    $type_mapping = [
      'text' => 'string',
      'text_long' => 'object',
      'text_with_summary' => 'object',
      'string' => 'string',
      'string_long' => 'string',
      'number' => 'number',
      'number_integer' => 'integer',
      'number_float' => 'number',
      'decimal' => 'number',
      'float' => 'number',
      'integer' => 'integer',
      'boolean' => 'boolean',
      'datetime' => 'array',
      'created' => 'string',
      'changed' => 'string',
      'entity_reference' => 'array',
      'image' => 'array',
      'file' => 'array',
      'list_string' => 'string',
      'list_integer' => 'integer',
      'list_float' => 'number',
      'list_boolean' => 'boolean',
      'email' => 'string',
      'telephone' => 'string',
      'uri' => 'string',
      'address' => 'object',
      'link' => 'array',
      'options' => 'string',
      'datetime_range' => 'object',
      'daterange' => 'object',
      'daterange_timezone' => 'object',
      'geolocation' => 'object',
      'geofield' => 'object',
      'media' => 'array',
      'paragraphs' => 'array',
      'entity_reference_revisions' => 'array',
    ];

    if (isset($type_mapping[$field_definition->getType()])) {
      return $type_mapping[$field_definition->getType()];
    }

    // Default for unknown types.
    return 'string';
  }

  /**
   * Gets schema reference for a route.
   *
   * @param string $route_name
   *   The route name.
   *
   * @return string
   *   The schema reference.
   */
  protected function getSchemaRef($route_name) {
    // Extract entity type and bundle from route name.
    if (preg_match('/rest\.(\w+)_(\w+)_(\w+)/', $route_name, $matches)) {
      return ucfirst($matches[2]) . ucfirst($matches[3]);
    }
    return 'DefaultResponse';
  }

  /**
   * Add example responses to the OpenAPI spec.
   *
   * @param array &$spec
   *   The OpenAPI specification array.
   */
  protected function addExampleResponses(array &$spec) {
    // Add examples for each path.
    foreach ($spec['paths'] as $path => &$methods) {
      foreach ($methods as $method => &$operation) {
        if (isset($operation['responses']['200']['content']['application/json']['schema'])) {
          // Try to find a plugin that provides an example for this path and
          // method.
          foreach ($this->schemaProviderManager->getSortedProviders() as $provider) {
            $example = $provider->generateExample($path, $method);

            if ($example) {
              $operation['responses']['200']['content']['application/json']['example'] = $example;
              // Break once we have an example.
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Convert a string to camelCase.
   *
   * @param string $input
   *   String to convert.
   *
   * @return string
   *   camelCase string.
   */
  protected function camelize($input) {
    $input = str_replace('_', ' ', strtolower($input));
    $input = ucwords($input);
    $input = str_replace(' ', '', $input);
    return $input;
  }

  /**
   * Adds Zod schema information to the OpenAPI spec.
   *
   * @param array &$spec
   *   The OpenAPI specification array.
   */
  protected function addZodSchemaInfo(array &$spec) {
    // Add informational section about Zod schema generation.
    $spec['info']['x-zod-schemas'] = [
      'description' => 'This API documentation can be used to generate Zod schemas for TypeScript validation',
      'generation_note' => 'You can convert this OpenAPI spec to Zod schemas using libraries like openapi-zod-client or openapi-to-zod',
      'example_usage' => [
        'installation' => 'npm install openapi-zod-client',
        'command' => 'npx openapi-zod-client ./openapi.json --output ./src/schemas',
      ],
    ];

    // Add TypeScript example for validating response data.
    $spec['info']['x-typescript-example'] = [
      'description' => 'Example TypeScript code using Zod schemas generated from this API spec',
      'code' => [
        'import { z } from "zod";',
        'import { schemas } from "./schemas";',
        '',
        '// Define the API response schema',
        'const RestFrameworkResponseSchema = z.object({',
        '  data: schemas.NodeResponse,',
        '  meta: z.object({',
        '    timestamp: z.number(),',
        '    version: z.string(),',
        '    language: z.object({',
        '      current: z.string(),',
        '      default: z.string(),',
        '      available: z.record(z.string(), z.object({',
        '        langcode: z.string(),',
        '        name: z.string(),',
        '        url: z.string().url(),',
        '        path: z.string(),',
        '      })),',
        '    }),',
        '  }),',
        '});',
        '',
        '// Example function to fetch and validate API data',
        'async function fetchNodeData(id: number) {',
        '  const response = await fetch(`/api/v1/node/${id}`);',
        '  const data = await response.json();',
        '  ',
        '  // Validate the response against our schema',
        '  const parsedData = RestFrameworkResponseSchema.parse(data);',
        '  ',
        '  return parsedData;',
        '}',
      ],
    ];

    // Add discriminated union for paragraph types.
    $spec['components']['schemas']['ZodParagraphTypes'] = [
      'oneOf' => $this->getParagraphReferences(),
      'discriminator' => [
        'propertyName' => 'block_type',
      ],
    ];
  }

  /**
   * Determines if a route is a REST API endpoint.
   *
   * @param \Symfony\Component\Routing\Route $route
   *   The route to check.
   *
   * @return bool
   *   TRUE if the route is a REST endpoint.
   */
  protected function isRestRoute($route) {
    // Check for REST-related defaults.
    foreach ($route->getDefaults() as $key => $value) {
      if (strpos($key, '_rest') === 0 ||
          strpos($key, 'rest_') === 0 ||
          $key === '_controller' && (
              strpos($value, 'Rest') !== FALSE ||
              strpos($value, '\\rest\\') !== FALSE ||
              strpos($value, 'RestFramework') !== FALSE)
         ) {
        return TRUE;
      }
    }

    // Check the path pattern - API-like patterns.
    $path = $route->getPath();
    if (strpos($path, '/api/') === 0 ||
        strpos($path, '/rest/') === 0 ||
        strpos($path, '/jsonapi/') === 0) {
      return TRUE;
    }

    return FALSE;
  }

  /**
   * Generate an example response for a specific path and method.
   *
   * @param string $path
   *   The path to generate an example for.
   * @param string $method
   *   The HTTP method.
   *
   * @return array|null
   *   The example data, or NULL if no example is available.
   */
  protected function generateExampleForPath($path, $method) {
    // The plugin system now handles example generation, so this is a fallback
    // that should never be used. All examples should come from plugins.
    return NULL;
  }

  /**
   * Adds a schema provider.
   *
   * @param \Drupal\rest_framework\OpenApiSchemaProviderInterface $provider
   *   The schema provider.
   */
  public function addSchemaProvider(OpenApiSchemaProviderInterface $provider) {
    $this->schemaProviders[] = $provider;
  }

  /**
   * Gets sorted schema providers.
   *
   * @return \Drupal\rest_framework\OpenApiSchemaProviderInterface[]
   *   The sorted schema providers.
   */
  protected function getSortedSchemaProviders() {
    // Sort providers by priority (higher priority means processed later)
    usort($this->schemaProviders, function (OpenApiSchemaProviderInterface $a, OpenApiSchemaProviderInterface $b) {
      return $a->getPriority() <=> $b->getPriority();
    });

    return $this->schemaProviders;
  }

  /**
   * Add endpoints from schema providers to the OpenAPI specification.
   *
   * @param array &$spec
   *   The OpenAPI specification array.
   */
  protected function addProvidedEndpoints(array &$spec) {
    foreach ($this->schemaProviderManager->getSortedProviders() as $provider) {
      // Add path definitions.
      foreach ($provider->getPathDefinitions() as $path => $pathItem) {
        if (!isset($spec['paths'][$path])) {
          $spec['paths'][$path] = [];
        }

        // Merge path operations (GET, POST, etc.)
        foreach ($pathItem as $method => $operation) {
          $spec['paths'][$path][$method] = $operation;
        }
      }

      // Add component definitions.
      foreach ($provider->getComponentDefinitions() as $name => $component) {
        if (!isset($spec['components']['schemas'][$name])) {
          $spec['components']['schemas'][$name] = $component;
        }
      }
    }
  }

}
