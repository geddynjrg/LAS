<?php

namespace Drupal\rest_framework\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides default OpenAPI schema definitions for the rest_framework module.
 *
 * @OpenApiSchemaProvider(
 *   id = "default",
 *   label = @Translation("Default Schema Provider"),
 *   priority = -10
 * )
 */
class DefaultSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    $paths = [];

    // Example: Node endpoint.
    $paths['/api/v1/node/{id}'] = [
      'get' => [
        'summary' => 'Get node by ID',
        'description' => 'Retrieves a specific node by its ID.',
        'operationId' => 'rest_framework.node_get',
        'parameters' => [
          [
            'name' => 'id',
            'in' => 'path',
            'required' => TRUE,
            'schema' => [
              'type' => 'string',
            ],
            'description' => 'The node ID',
          ],
          [
            'name' => 'X-Language',
            'in' => 'header',
            'required' => TRUE,
            'schema' => [
              'type' => 'string',
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'Node retrieved successfully',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      'type' => 'object',
                      'oneOf' => [
                        ['$ref' => '#/components/schemas/NodeCourse'],
                        ['$ref' => '#/components/schemas/NodeInstitution'],
                        ['$ref' => '#/components/schemas/NodeLanding'],
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
                ],
              ],
            ],
          ],
          '404' => [
            'description' => 'Node not found',
          ],
        ],
        'tags' => ['Content'],
        'security' => [],
      ],
    ];

    // Example: Content Path Resolution endpoint.
    $paths['/api/v1/resolve'] = [
      'get' => [
        'summary' => 'Resolve content by path alias',
        'description' => 'Resolves a path alias to its corresponding content.',
        'operationId' => 'rest_framework.resolve_content',
        'parameters' => [
          [
            'name' => 'X-Path',
            'in' => 'header',
            'required' => TRUE,
            'schema' => [
              'type' => 'string',
            ],
            'description' => 'The path alias to resolve',
          ],
          [
            'name' => 'X-Language',
            'in' => 'header',
            'required' => TRUE,
            'schema' => [
              'type' => 'string',
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'Content resolved successfully',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      'type' => 'object',
                      'oneOf' => [
                        ['$ref' => '#/components/schemas/NodeCourse'],
                        ['$ref' => '#/components/schemas/NodeInstitution'],
                        ['$ref' => '#/components/schemas/NodeLanding'],
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
                ],
              ],
            ],
          ],
          '404' => [
            'description' => 'Content not found',
          ],
        ],
        'tags' => ['Content'],
        'security' => [],
      ],
    ];

    // Add other default endpoints as needed.
    return $paths;
  }

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    $components = [];

    // Common response component schemas.
    $components['RestFrameworkResponse'] = [
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

    // Base node response schema.
    $components['NodeResponse'] = [
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

    // Node list response schema.
    $components['NodeListResponse'] = [
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

    // Request body schema.
    $components['RequestBody'] = [
      'type' => 'object',
      'properties' => [
        'data' => [
          'type' => 'object',
          'description' => 'The request data',
        ],
      ],
      'required' => ['data'],
    ];

    return $components;
  }

}
