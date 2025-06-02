<?php

namespace Drupal\api_content\Plugin\OpenApiSchemaProvider;

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
    $components = [];

    // Define the main node landing schema.
    $components['NodeLanding'] = [
      'type' => 'object',
      'properties' => [
        'id' => [
          'type' => 'string',
          'description' => 'The node ID',
          'example' => '1',
        ],
        'type' => [
          'type' => 'string',
          'description' => 'The node bundle type',
          'example' => 'landing',
        ],
        'uuid' => [
          'type' => 'string',
          'description' => 'The node UUID',
          'example' => '6f1a686b-3645-42d3-8ef4-673a1cd92079',
        ],
        'title' => [
          'type' => 'string',
          'description' => 'The node title',
          'example' => 'Apply for Your Loan Today',
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
          'required' => ['code', 'name', 'direction'],
        ],
        'url' => [
          'type' => 'string',
          'description' => 'The absolute URL to the node',
          'example' => 'https://example.com/loan-application',
        ],
        'path_alias' => [
          'type' => 'string',
          'description' => 'The path alias of the node',
          'example' => '/loan-application',
        ],
        'content' => [
          'type' => 'object',
          'properties' => [
            'body' => [
              '$ref' => '#/components/schemas/TextWithFormat',
            ],
            'page_components' => [
              'type' => 'array',
              'items' => [
                'oneOf' => [
                  ['$ref' => '#/components/schemas/BannerBlock'],
                  ['$ref' => '#/components/schemas/TextBlocksContainer'],
                ],
              ],
            ],
          ],
        ],
      ],
      'required' => ['id', 'type', 'uuid', 'title', 'language', 'url', 'path_alias', 'content'],
    ];

    // Text with format schema (used for body and text fields)
    $components['TextWithFormat'] = [
      'type' => 'object',
      'properties' => [
        'value' => [
          'type' => 'string',
          'description' => 'The raw text value',
          'example' => '<p>Get the financial support you need with our quick loan application process.</p>',
        ],
        'format' => [
          'type' => 'string',
          'description' => 'The text format',
          'example' => 'full_html',
        ],
        'processed' => [
          'type' => 'string',
          'description' => 'The processed/rendered text',
          'example' => '<p>Get the financial support you need with our quick loan application process.</p>',
        ],
      ],
      'required' => ['value', 'format', 'processed'],
    ];

    // Banner block schema.
    $components['BannerBlock'] = [
      'type' => 'object',
      'properties' => [
        'block_type' => [
          'type' => 'string',
          'enum' => ['banner'],
          'example' => 'banner',
        ],
        'title' => [
          'type' => 'string',
          'description' => 'The banner title',
          'example' => 'Quick Loan Approval',
        ],
        'text' => [
          '$ref' => '#/components/schemas/TextWithFormat',
        ],
        'button' => [
          'type' => 'array',
          'items' => [
            '$ref' => '#/components/schemas/LinkButton',
          ],
        ],
      ],
      'required' => ['block_type', 'title'],
    ];

    // Text blocks container schema.
    $components['TextBlocksContainer'] = [
      'type' => 'object',
      'properties' => [
        'block_type' => [
          'type' => 'string',
          'enum' => ['text_blocks'],
          'example' => 'text_blocks',
        ],
        'blocks' => [
          'type' => 'array',
          'items' => [
            '$ref' => '#/components/schemas/TextBlock',
          ],
        ],
      ],
      'required' => ['block_type', 'blocks'],
    ];

    // Individual text block schema.
    $components['TextBlock'] = [
      'type' => 'object',
      'properties' => [
        'block_type' => [
          'type' => 'string',
          'enum' => ['text_block'],
          'example' => 'text_block',
        ],
        'text' => [
          '$ref' => '#/components/schemas/TextWithFormat',
        ],
        'button' => [
          'type' => 'array',
          'items' => [
            '$ref' => '#/components/schemas/LinkButton',
          ],
        ],
      ],
      'required' => ['block_type', 'text'],
    ];

    // Link button schema.
    $components['LinkButton'] = [
      'type' => 'object',
      'properties' => [
        'title' => [
          'type' => 'string',
          'description' => 'The link title/text',
          'example' => 'Apply Now',
        ],
        'url' => [
          'type' => 'string',
          'description' => 'The link URL',
          'example' => 'https://example.com/apply',
        ],
        'options' => [
          'type' => 'array',
          'description' => 'Additional link options',
          'example' => [],
        ],
        'is_external' => [
          'type' => 'boolean',
          'description' => 'Whether the link is external',
          'example' => FALSE,
        ],
      ],
      'required' => ['title', 'url', 'options', 'is_external'],
    ];

    return $components;
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
          'id' => '1',
          'type' => 'landing',
          'uuid' => '6f1a686b-3645-42d3-8ef4-673a1cd92079',
          'title' => 'Apply for Your Loan Today',
          'language' => [
            'code' => 'en',
            'name' => 'English',
            'direction' => 'ltr',
          ],
          'url' => 'https://uwezo-api.ddev.site/front',
          'path_alias' => '/front',
          'content' => [
            'body' => [
              'value' => '<p>Get the financial support you need with our quick and easy loan application process.</p>',
              'format' => 'full_html',
              'processed' => '<p>Get the financial support you need with our quick and easy loan application process.</p>',
            ],
            'page_components' => [
              [
                'block_type' => 'banner',
                'title' => 'Quick Loan Approval',
                'text' => [
                  'value' => '<p>Apply for a loan in minutes and get approved within 24 hours</p>',
                  'format' => 'full_html',
                  'processed' => '<p>Apply for a loan in minutes and get approved within 24 hours</p>',
                ],
                'button' => [
                  [
                    'title' => 'Apply Now',
                    'url' => 'https://uwezo-api.ddev.site/apply',
                    'options' => [],
                    'is_external' => FALSE,
                  ],
                ],
              ],
              [
                'block_type' => 'text_blocks',
                'blocks' => [
                  [
                    'block_type' => 'text_block',
                    'text' => [
                      'value' => '<p><strong>Personal Loans</strong></p><p>Flexible personal loans for any purpose with competitive interest rates.</p>',
                      'format' => 'full_html',
                      'processed' => '<p><strong>Personal Loans</strong></p><p>Flexible personal loans for any purpose with competitive interest rates.</p>',
                    ],
                    'button' => [
                      [
                        'title' => 'Learn More',
                        'url' => 'https://uwezo-api.ddev.site/personal-loans',
                        'options' => [],
                        'is_external' => FALSE,
                      ],
                    ],
                  ],
                  [
                    'block_type' => 'text_block',
                    'text' => [
                      'value' => '<p><strong>Business Loans</strong></p><p>Grow your business with our tailored business loan solutions.</p>',
                      'format' => 'full_html',
                      'processed' => '<p><strong>Business Loans</strong></p><p>Grow your business with our tailored business loan solutions.</p>',
                    ],
                    'button' => [
                      [
                        'title' => 'Apply for Business Loan',
                        'url' => 'https://uwezo-api.ddev.site/business-loans',
                        'options' => [],
                        'is_external' => FALSE,
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
        'meta' => [
          'timestamp' => 1748890815,
          'version' => 'v1',
          'language' => [
            'current' => 'en',
            'default' => 'en',
            'available' => [
              'en' => [
                'langcode' => 'en',
                'name' => 'English',
                'url' => 'https://uwezo-api.ddev.site/front',
                'path' => '/front',
              ],
            ],
          ],
        ],
      ];
    }

    if ($path === '/api/v1/resolve' && $method === 'get') {
      return [
        'data' => [
          'id' => '2',
          'type' => 'landing',
          'uuid' => '550e8400-e29b-41d4-a716-446655440000',
          'title' => 'About Our Loan Services',
          'language' => [
            'code' => 'en',
            'name' => 'English',
            'direction' => 'ltr',
          ],
          'url' => 'https://uwezo-api.ddev.site/about',
          'path_alias' => '/about',
          'content' => [
            'body' => [
              'value' => '<p>Learn more about our mission to provide accessible financial solutions for everyone.</p>',
              'format' => 'full_html',
              'processed' => '<p>Learn more about our mission to provide accessible financial solutions for everyone.</p>',
            ],
            'page_components' => [
              [
                'block_type' => 'banner',
                'title' => 'Trusted Financial Partner',
                'text' => [
                  'value' => '<p>Your reliable partner for all your financial needs</p>',
                  'format' => 'full_html',
                  'processed' => '<p>Your reliable partner for all your financial needs</p>',
                ],
                'button' => [
                  [
                    'title' => 'Check Eligibility',
                    'url' => 'https://uwezo-api.ddev.site/eligibility',
                    'options' => [],
                    'is_external' => FALSE,
                  ],
                ],
              ],
              [
                'block_type' => 'text_blocks',
                'blocks' => [
                  [
                    'block_type' => 'text_block',
                    'text' => [
                      'value' => '<p><strong>Our Mission</strong></p><p>To provide accessible and affordable loan solutions that empower individuals and businesses to achieve their financial goals.</p>',
                      'format' => 'full_html',
                      'processed' => '<p><strong>Our Mission</strong></p><p>To provide accessible and affordable loan solutions that empower individuals and businesses to achieve their financial goals.</p>',
                    ],
                    'button' => [
                      [
                        'title' => 'Contact Us',
                        'url' => 'https://uwezo-api.ddev.site/contact',
                        'options' => [],
                        'is_external' => FALSE,
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
        'meta' => [
          'timestamp' => 1748890815,
          'version' => 'v1',
          'language' => [
            'current' => 'en',
            'default' => 'en',
            'available' => [
              'en' => [
                'langcode' => 'en',
                'name' => 'English',
                'url' => 'https://uwezo-api.ddev.site/about',
                'path' => '/about',
              ],
            ],
          ],
        ],
      ];
    }

    return NULL;
  }

}
