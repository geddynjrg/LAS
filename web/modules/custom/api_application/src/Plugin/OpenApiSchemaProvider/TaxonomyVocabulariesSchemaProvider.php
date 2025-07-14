<?php

namespace Drupal\api_application\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema definitions for taxonomy vocabularies endpoints.
 *
 * @OpenApiSchemaProvider(
 *   id = "taxonomy_vocabularies",
 *   label = @Translation("Taxonomy Vocabularies Schema Provider"),
 *   priority = 0
 * )
 */
class TaxonomyVocabulariesSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    $paths = [];

    $paths['/api/v1/application/taxonomy-vocabularies'] = [
      'get' => [
        'summary' => 'Get all taxonomy vocabularies for Application forms',
        'description' => 'Retrieves all taxonomy vocabularies and their terms used in Application entity forms.',
        'operationId' => 'api_application.taxonomy_vocabularies_get',
        'parameters' => [
          [
            'name' => 'X-Language',
            'in' => 'header',
            'required' => FALSE,
            'schema' => [
              'type' => 'string',
              'default' => 'en',
            ],
            'description' => 'The language code for the response (e.g., "en", "sw")',
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'Taxonomy vocabularies retrieved successfully',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      'type' => 'object',
                      'description' => 'Taxonomy vocabularies data',
                      'oneOf' => [
                        ['$ref' => '#/components/schemas/TaxonomyVocabulary'],
                      ],
                    ],
                    'meta' => [
                      '$ref' => '#/components/schemas/TaxonomyVocabulariesMeta',
                    ],
                  ],
                  'required' => ['data', 'meta'],
                ],
              ],
            ],
          ],
          '400' => [
            'description' => 'Invalid language code provided',
            'content' => [
              'application/json' => [
                'schema' => [
                  '$ref' => '#/components/schemas/ErrorResponse',
                ],
              ],
            ],
          ],
        ],
        'tags' => ['Application', 'Taxonomy'],
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

    $components['TaxonomyVocabulary'] = [
      'type' => 'object',
      'title' => 'Taxonomy Vocabulary',
      'description' => 'A taxonomy vocabulary with its terms',
      'properties' => [
        'vocabulary_id' => [
          'type' => 'string',
          'description' => 'The machine name of the vocabulary',
          'example' => 'group_background',
        ],
        'vocabulary_label' => [
          'type' => 'string',
          'description' => 'The human-readable label of the vocabulary',
          'example' => 'Group Background',
        ],
        'vocabulary_description' => [
          'type' => 'string',
          'description' => 'The description of the vocabulary',
          'example' => 'Categories for group background types',
        ],
        'field_name' => [
          'type' => 'string',
          'description' => 'The field name in the entity that references this vocabulary',
          'example' => 'group_background',
        ],
        'entity_type' => [
          'type' => 'string',
          'description' => 'The entity type that uses this vocabulary',
          'example' => 'application',
          'enum' => ['application', 'group_member'],
        ],
        'cardinality' => [
          'type' => 'string',
          'description' => 'Whether the field accepts single or multiple values',
          'example' => 'multiple',
          'enum' => ['single', 'multiple'],
        ],
        'auto_create' => [
          'type' => 'boolean',
          'description' => 'Whether new terms can be auto-created for this vocabulary',
          'example' => FALSE,
        ],
        'terms' => [
          'type' => 'array',
          'description' => 'Array of taxonomy terms in this vocabulary',
          'items' => [
            '$ref' => '#/components/schemas/TaxonomyTerm',
          ],
        ],
        'total_terms' => [
          'type' => 'integer',
          'description' => 'Total number of terms in this vocabulary',
          'example' => 5,
        ],
      ],
      'required' => [
        'vocabulary_id',
        'vocabulary_label',
        'vocabulary_description',
        'field_name',
        'entity_type',
        'cardinality',
        'auto_create',
        'terms',
        'total_terms',
      ],
    ];

    $components['TaxonomyTerm'] = [
      'type' => 'object',
      'title' => 'Taxonomy Term',
      'description' => 'A taxonomy term',
      'properties' => [
        'tid' => [
          'type' => 'integer',
          'description' => 'The term ID',
          'example' => 1,
        ],
        'uuid' => [
          'type' => 'string',
          'description' => 'The term UUID',
          'example' => '550e8400-e29b-41d4-a716-446655440000',
        ],
        'name' => [
          'type' => 'string',
          'description' => 'The term name',
          'example' => 'Youth Group',
        ],
        'description' => [
          'type' => 'object',
          'description' => 'The term description',
          'properties' => [
            'value' => [
              'type' => 'string',
              'description' => 'The raw description text',
              'example' => 'Groups primarily composed of young people',
            ],
            'format' => [
              'type' => 'string',
              'description' => 'The text format',
              'example' => 'basic_html',
            ],
            'processed' => [
              'type' => 'string',
              'description' => 'The processed description HTML',
              'example' => '<p>Groups primarily composed of young people</p>',
            ],
          ],
          'required' => ['value', 'format', 'processed'],
        ],
        'weight' => [
          'type' => 'integer',
          'description' => 'The term weight (for ordering)',
          'example' => 0,
        ],
        'parent_ids' => [
          'type' => 'array',
          'description' => 'Array of parent term IDs',
          'items' => [
            'type' => 'integer',
          ],
          'example' => [],
        ],
        'url' => [
          'type' => 'string',
          'description' => 'The absolute URL to the term',
          'example' => 'https://example.com/taxonomy/term/1',
        ],
        'language' => [
          'type' => 'object',
          'description' => 'Language information for the term',
          'properties' => [
            'code' => [
              'type' => 'string',
              'description' => 'The language code',
              'example' => 'en',
            ],
            'name' => [
              'type' => 'string',
              'description' => 'The language name',
              'example' => 'English',
            ],
          ],
          'required' => ['code', 'name'],
        ],
      ],
      'required' => [
        'tid',
        'uuid',
        'name',
        'description',
        'weight',
        'parent_ids',
        'url',
        'language',
      ],
    ];

    $components['TaxonomyVocabulariesMeta'] = [
      'type' => 'object',
      'title' => 'Taxonomy Vocabularies Meta',
      'description' => 'Metadata for taxonomy vocabularies response',
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
        'total_vocabularies' => [
          'type' => 'integer',
          'description' => 'Total number of vocabularies in the response',
          'example' => 9,
        ],
        'language' => [
          'type' => 'object',
          'description' => 'Language information',
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
              'description' => 'Available languages',
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
                    'example' => 'https://example.com/api/v1/application/taxonomy-vocabularies',
                  ],
                  'path' => [
                    'type' => 'string',
                    'example' => '/api/v1/application/taxonomy-vocabularies',
                  ],
                ],
                'required' => ['langcode', 'name', 'url', 'path'],
              ],
            ],
          ],
          'required' => ['current', 'default', 'available'],
        ],
      ],
      'required' => ['timestamp', 'version', 'total_vocabularies', 'language'],
    ];

    $components['ErrorResponse'] = [
      'type' => 'object',
      'title' => 'Error Response',
      'description' => 'Error response structure',
      'properties' => [
        'error' => [
          'type' => 'string',
          'description' => 'Error type',
          'example' => 'Invalid language code',
        ],
        'message' => [
          'type' => 'string',
          'description' => 'Detailed error message',
          'example' => 'Language code "xx" is not supported. Available languages: en, sw',
        ],
        'available_languages' => [
          'type' => 'array',
          'description' => 'List of available language codes',
          'items' => [
            'type' => 'string',
          ],
          'example' => ['en', 'sw'],
        ],
      ],
      'required' => ['error', 'message', 'available_languages'],
    ];

    return $components;
  }

  /**
   * {@inheritdoc}
   */
  public function generateExample(string $path, string $method): ?array {
    if ($path === '/api/v1/application/taxonomy-vocabularies' && $method === 'get') {
      return [
        'data' => [
          'group_background' => [
            'vocabulary_id' => 'group_background',
            'vocabulary_label' => 'Group Background',
            'vocabulary_description' => 'Categories for group background types',
            'field_name' => 'group_background',
            'entity_type' => 'application',
            'cardinality' => 'multiple',
            'auto_create' => FALSE,
            'terms' => [
              [
                'tid' => 1,
                'uuid' => '550e8400-e29b-41d4-a716-446655440000',
                'name' => 'Youth Group',
                'description' => [
                  'value' => 'Groups primarily composed of young people',
                  'format' => 'basic_html',
                  'processed' => '<p>Groups primarily composed of young people</p>',
                ],
                'weight' => 0,
                'parent_ids' => [],
                'url' => 'https://example.com/taxonomy/term/1',
                'language' => [
                  'code' => 'en',
                  'name' => 'English',
                ],
              ],
              [
                'tid' => 2,
                'uuid' => '550e8400-e29b-41d4-a716-446655440001',
                'name' => 'Women Group',
                'description' => [
                  'value' => 'Groups primarily composed of women',
                  'format' => 'basic_html',
                  'processed' => '<p>Groups primarily composed of women</p>',
                ],
                'weight' => 1,
                'parent_ids' => [],
                'url' => 'https://example.com/taxonomy/term/2',
                'language' => [
                  'code' => 'en',
                  'name' => 'English',
                ],
              ],
            ],
            'total_terms' => 2,
          ],
          'counties' => [
            'vocabulary_id' => 'counties',
            'vocabulary_label' => 'Counties',
            'vocabulary_description' => 'Counties of operations',
            'field_name' => 'county',
            'entity_type' => 'application',
            'cardinality' => 'single',
            'auto_create' => FALSE,
            'terms' => [
              [
                'tid' => 10,
                'uuid' => '550e8400-e29b-41d4-a716-446655440010',
                'name' => 'Nairobi',
                'description' => [
                  'value' => 'Nairobi County',
                  'format' => 'basic_html',
                  'processed' => '<p>Nairobi County</p>',
                ],
                'weight' => 0,
                'parent_ids' => [],
                'url' => 'https://example.com/taxonomy/term/10',
                'language' => [
                  'code' => 'en',
                  'name' => 'English',
                ],
              ],
              [
                'tid' => 11,
                'uuid' => '550e8400-e29b-41d4-a716-446655440011',
                'name' => 'Mombasa',
                'description' => [
                  'value' => 'Mombasa County',
                  'format' => 'basic_html',
                  'processed' => '<p>Mombasa County</p>',
                ],
                'weight' => 1,
                'parent_ids' => [],
                'url' => 'https://example.com/taxonomy/term/11',
                'language' => [
                  'code' => 'en',
                  'name' => 'English',
                ],
              ],
            ],
            'total_terms' => 2,
          ],
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
          'total_vocabularies' => 9,
          'language' => [
            'current' => 'en',
            'default' => 'en',
            'available' => [
              'en' => [
                'langcode' => 'en',
                'name' => 'English',
                'url' => 'https://example.com/api/v1/application/taxonomy-vocabularies',
                'path' => '/api/v1/application/taxonomy-vocabularies',
              ],
              'sw' => [
                'langcode' => 'sw',
                'name' => 'Swahili',
                'url' => 'https://example.com/api/v1/application/taxonomy-vocabularies',
                'path' => '/api/v1/application/taxonomy-vocabularies',
              ],
            ],
          ],
        ],
      ];
    }

    return NULL;
  }

}
