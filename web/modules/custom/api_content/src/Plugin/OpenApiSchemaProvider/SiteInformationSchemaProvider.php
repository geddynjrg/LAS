<?php

namespace Drupal\api_content\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema definitions for site information endpoints.
 *
 * @OpenApiSchemaProvider(
 *   id = "site_information",
 *   label = @Translation("Site Information Schema Provider"),
 *   priority = 0
 * )
 */
class SiteInformationSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    $paths = [];

    $paths['/api/v1/site-info'] = [
      'get' => [
        'summary' => 'Get site information',
        'description' => 'Returns site configuration including name, contact information, and useful links.',
        'operationId' => 'rest_framework.site_info_get',
        'tags' => ['Site Information'],
        'parameters' => [
          [
            'name' => 'X-Language',
            'in' => 'header',
            'description' => 'Preferred language code',
            'required' => FALSE,
            'schema' => [
              'type' => 'string',
              'example' => 'en',
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'Successful response',
            'content' => [
              'application/json' => [
                'schema' => [
                  '$ref' => '#/components/schemas/SiteInformationResponse',
                ],
                'example' => $this->generateExample('/api/v1/site-info', 'get'),
              ],
            ],
          ],
          '404' => [
            'description' => 'Not found',
          ],
          '500' => [
            'description' => 'Internal server error',
          ],
        ],
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

    // Site Information Response schema.
    $components['SiteInformationResponse'] = [
      'type' => 'object',
      'properties' => [
        'data' => [
          '$ref' => '#/components/schemas/SiteInformationData',
        ],
        'meta' => [
          '$ref' => '#/components/schemas/SiteInformationMeta',
        ],
      ],
      'required' => ['data', 'meta'],
    ];

    // Site Information Data schema.
    $components['SiteInformationData'] = [
      'type' => 'object',
      'properties' => [
        'site' => [
          'type' => 'object',
          'properties' => [
            'name' => [
              'type' => 'string',
              'description' => 'The site name',
              'example' => 'Uwezo Kenya',
            ],
            'slogan' => [
              'type' => 'string',
              'description' => 'The site slogan',
              'example' => 'Empowering Communities',
            ],
            'mail' => [
              'type' => 'string',
              'format' => 'email',
              'description' => 'The site system email address',
              'example' => 'system@uwezo.go.ke',
            ],
            'contact' => [
              'type' => 'object',
              'properties' => [
                'address' => [
                  'type' => 'string',
                  'description' => 'Physical address',
                  'example' => 'Lonrho House, 16th Floor, Standard Street',
                ],
                'po_box' => [
                  'type' => 'string',
                  'description' => 'Postal box address',
                  'example' => '42009-00100, Nairobi',
                ],
                'phone' => [
                  'type' => 'string',
                  'description' => 'Contact phone number',
                  'example' => '+254 0776 154 215',
                ],
                'email' => [
                  'type' => 'string',
                  'format' => 'email',
                  'description' => 'Contact email address',
                  'example' => 'info@uwezo.go.ke',
                ],
              ],
              'required' => ['address', 'po_box', 'phone', 'email'],
            ],
          ],
          'required' => ['name', 'slogan', 'mail', 'contact'],
        ],
        'useful_links' => [
          'type' => 'array',
          'description' => 'List of useful external links',
          'items' => [
            '$ref' => '#/components/schemas/UsefulLink',
          ],
        ],
      ],
      'required' => ['site', 'useful_links'],
    ];

    // Useful Link schema.
    $components['UsefulLink'] = [
      'type' => 'object',
      'properties' => [
        'id' => [
          'type' => 'string',
          'format' => 'uuid',
          'description' => 'Unique identifier for the link',
          'example' => '123e4567-e89b-12d3-a456-426614174000',
        ],
        'title' => [
          'type' => 'string',
          'description' => 'Link title',
          'example' => 'Staff Mail',
        ],
        'url' => [
          'type' => 'string',
          'format' => 'url',
          'description' => 'Link URL',
          'example' => 'https://mail.kenya.go.ke',
        ],
        'weight' => [
          'type' => 'integer',
          'description' => 'Sort weight for ordering',
          'example' => 0,
        ],
        'external' => [
          'type' => 'boolean',
          'description' => 'Whether the link is external',
          'example' => TRUE,
        ],
      ],
      'required' => ['id', 'title', 'url', 'weight', 'external'],
    ];

    // Meta information schema.
    $components['SiteInformationMeta'] = [
      'type' => 'object',
      'properties' => [
        'timestamp' => [
          'type' => 'integer',
          'description' => 'Unix timestamp of the response',
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
                  'direction' => [
                    'type' => 'string',
                    'enum' => ['ltr', 'rtl'],
                    'example' => 'ltr',
                  ],
                ],
              ],
            ],
          ],
          'required' => ['current', 'default', 'available'],
        ],
      ],
      'required' => ['timestamp', 'version', 'language'],
    ];

    return $components;
  }

  /**
   * {@inheritdoc}
   */
  public function generateExample(string $path, string $method): ?array {
    if ($path !== '/api/v1/site-info' || $method !== 'get') {
      return NULL;
    }

    return [
      'data' => [
        'site' => [
          'name' => 'Uwezo Kenya',
          'slogan' => 'Empowering Communities',
          'mail' => 'system@uwezo.go.ke',
          'contact' => [
            'address' => 'Lonrho House, 16th Floor, Standard Street',
            'po_box' => '42009-00100, Nairobi',
            'phone' => '+254 0776 154 215',
            'email' => 'info@uwezo.go.ke',
          ],
        ],
        'useful_links' => [
          [
            'id' => '123e4567-e89b-12d3-a456-426614174001',
            'title' => 'Staff Mail',
            'url' => 'https://mail.kenya.go.ke',
            'weight' => 0,
            'external' => TRUE,
          ],
          [
            'id' => '123e4567-e89b-12d3-a456-426614174002',
            'title' => 'MyGov',
            'url' => 'https://mygov.go.ke',
            'weight' => 1,
            'external' => TRUE,
          ],
          [
            'id' => '123e4567-e89b-12d3-a456-426614174003',
            'title' => 'eCitizen',
            'url' => 'https://ecitizen.go.ke',
            'weight' => 2,
            'external' => TRUE,
          ],
          [
            'id' => '123e4567-e89b-12d3-a456-426614174004',
            'title' => 'Public Service Jobs',
            'url' => 'https://psckenyajobs.go.ke',
            'weight' => 3,
            'external' => TRUE,
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
              'direction' => 'ltr',
            ],
          ],
        ],
      ],
    ];
  }

}
