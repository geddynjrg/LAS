<?php

namespace Drupal\rest_framework\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema definitions for content endpoints.
 *
 * @OpenApiSchemaProvider(
 *   id = "content_endpoints",
 *   label = @Translation("Content Endpoints Provider"),
 *   priority = -9
 * )
 */
class ContentEndpointsProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    $paths = [];

    // Node endpoint.
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

    // Path Resolution endpoint.
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

    return $paths;
  }

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    // Content-specific component schemas are defined in the core component
    // schemas that's shared across providers.
    return [];
  }

  /**
   * {@inheritdoc}
   */
  public function generateExample(string $path, string $method): ?array {
    // Only generate examples for paths this provider is responsible for.
    if (!isset($this->getPathDefinitions()[$path][$method])) {
      return NULL;
    }

    if ($path === '/api/v1/node/{id}' && $method === 'get') {
      return [
        'data' => [
          'id' => 123,
          'type' => 'course',
          'uuid' => '550e8400-e29b-41d4-a716-446655440000',
          'title' => 'Example Course',
          'language' => [
            'code' => 'en',
            'name' => 'English',
            'direction' => 'ltr',
          ],
          'url' => 'https://example.com/courses/example-course',
          'path_alias' => '/courses/example-course',
          'content' => [
            'description' => '<p>This is an example course description with details about the curriculum and learning outcomes.</p>',
            'duration' => '6 months',
            'price' => [
              'amount' => 1500,
              'currency' => 'KES',
              'formatted' => 'KES 1,500',
            ],
            'start_date' => '2023-09-01T00:00:00+03:00',
            'institution' => [
              'id' => 42,
              'name' => 'Example Technical Institute',
              'logo' => 'https://example.com/sites/default/files/institute-logo.png',
              'url' => 'https://example.com/institutions/example-technical-institute',
            ],
            'blocks' => [
              [
                'block_type' => 'course_details',
                'title' => 'Course Details',
                'level' => 'Intermediate',
                'credits' => 30,
                'certification' => 'Professional Certificate',
                'prerequisites' => 'Basic understanding of mathematics and computer skills',
              ],
              [
                'block_type' => 'course_curriculum',
                'title' => 'Curriculum',
                'modules' => [
                  [
                    'title' => 'Module 1: Introduction',
                    'description' => 'Overview of the course and basic concepts',
                    'duration' => '2 weeks',
                  ],
                  [
                    'title' => 'Module 2: Core Skills',
                    'description' => 'Development of essential technical skills',
                    'duration' => '4 weeks',
                  ],
                ],
              ],
            ],
          ],
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
          'language' => [
            'current' => 'en',
            'default' => 'en',
            'available' => [
              'en' => [
                'langcode' => 'en',
                'name' => 'English',
                'url' => 'https://example.com/courses/example-course',
                'path' => '/courses/example-course',
              ],
              'sw' => [
                'langcode' => 'sw',
                'name' => 'Swahili',
                'url' => 'https://example.com/sw/courses/example-course',
                'path' => '/sw/courses/example-course',
              ],
            ],
          ],
        ],
      ];
    }

    if ($path === '/api/v1/resolve' && $method === 'get') {
      // Similar example to the node/{id} response since it returns the same
      // structure.
      return [
        'data' => [
          'id' => 456,
          'type' => 'institution',
          'uuid' => '660f9511-f30c-52e5-b827-557766551111',
          'title' => 'Example Institution',
          'language' => [
            'code' => 'en',
            'name' => 'English',
            'direction' => 'ltr',
          ],
          'url' => 'https://example.com/institutions/example-institution',
          'path_alias' => '/institutions/example-institution',
          'content' => [
            'description' => '<p>This is an example institution with details about programs and facilities.</p>',
            'address' => '123 Education Street, Nairobi, Kenya',
            'phone' => '+254 123 456789',
            'email' => 'info@example-institution.edu',
            'website' => 'https://www.example-institution.edu',
            'blocks' => [
              [
                'block_type' => 'institution_details',
                'title' => 'Institution Details',
                'established' => '1985',
                'type' => 'Technical Training Institute',
                'accreditation' => 'Fully accredited by Ministry of Education',
              ],
              [
                'block_type' => 'facilities',
                'title' => 'Our Facilities',
                'items' => [
                  'Computer Labs',
                  'Engineering Workshops',
                  'Library',
                  'Student Center',
                  'Sports Complex',
                ],
              ],
            ],
          ],
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
          'language' => [
            'current' => 'en',
            'default' => 'en',
            'available' => [
              'en' => [
                'langcode' => 'en',
                'name' => 'English',
                'url' => 'https://example.com/institutions/example-institution',
                'path' => '/institutions/example-institution',
              ],
              'sw' => [
                'langcode' => 'sw',
                'name' => 'Swahili',
                'url' => 'https://example.com/sw/institutions/example-institution',
                'path' => '/sw/institutions/example-institution',
              ],
            ],
          ],
        ],
      ];
    }

    return NULL;
  }

}
