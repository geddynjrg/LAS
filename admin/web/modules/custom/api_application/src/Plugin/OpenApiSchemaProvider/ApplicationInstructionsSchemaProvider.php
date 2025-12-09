<?php

namespace Drupal\api_application\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema for Application Instructions endpoint.
 *
 * @OpenApiSchemaProvider(
 *   id = "application_instructions",
 *   label = @Translation("Application Instructions Schema"),
 * )
 */
class ApplicationInstructionsSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    return [
      'ApplicationInstructionsResponse' => [
        'type' => 'object',
        'description' => 'Response containing application instructions',
        'properties' => [
          'data' => [
            '$ref' => '#/components/schemas/ApplicationInstructions',
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
                          'example' => 'https://example.com/api/v1/application/instructions',
                        ],
                        'path' => [
                          'type' => 'string',
                          'example' => '/api/v1/application/instructions',
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
      ],
      'ApplicationInstructions' => [
        'type' => 'object',
        'description' => 'Application instructions and document requirements',
        'properties' => [
          'id' => [
            'type' => 'string',
            'description' => 'Unique identifier for instructions',
            'example' => 'application_instructions',
          ],
          'type' => [
            'type' => 'string',
            'description' => 'The content type',
            'example' => 'application_instructions',
          ],
          'title' => [
            'type' => 'string',
            'description' => 'The title of the instructions page',
            'example' => 'Application Instructions',
          ],
          'body' => [
            '$ref' => '#/components/schemas/FormattedText',
          ],
          'documents_required' => [
            'type' => 'array',
            'description' => 'List of required documents',
            'items' => [
              '$ref' => '#/components/schemas/DocumentRequirement',
            ],
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
            'description' => 'The absolute URL to access these instructions',
            'example' => 'https://example.com/api/v1/application/instructions',
          ],
        ],
        'required' => ['id', 'type', 'title', 'body', 'documents_required', 'url'],
      ],
      'FormattedText' => [
        'type' => 'object',
        'description' => 'Formatted text with processing information',
        'properties' => [
          'value' => [
            'type' => 'string',
            'description' => 'The raw text content',
            'example' => '<p>Please follow these instructions carefully when submitting your application.</p>',
          ],
          'format' => [
            'type' => 'string',
            'description' => 'The text format used for processing',
            'example' => 'basic_html',
            'enum' => ['basic_html', 'full_html', 'plain_text'],
          ],
          'processed' => [
            'type' => 'string',
            'description' => 'The processed HTML output',
            'example' => '<p>Please follow these instructions carefully when submitting your application.</p>',
          ],
        ],
        'required' => ['value', 'format', 'processed'],
      ],
      'DocumentRequirement' => [
        'type' => 'object',
        'description' => 'A required document configuration',
        'properties' => [
          'title' => [
            'type' => 'string',
            'description' => 'The name of the document',
            'example' => 'Valid group registration certificate',
          ],
          'subtitle' => [
            '$ref' => '#/components/schemas/FormattedText',
          ],
          'link' => [
            'type' => 'object',
            'nullable' => TRUE,
            'description' => 'Optional link for more information',
            'properties' => [
              'uri' => [
                'type' => 'string',
                'format' => 'uri',
                'description' => 'The URL',
                'example' => 'https://example.com/certificate-info',
              ],
              'title' => [
                'type' => 'string',
                'description' => 'The link text',
                'example' => 'More info about this certificate',
              ],
            ],
            'required' => ['uri', 'title'],
          ],
          'example_images' => [
            'type' => 'array',
            'description' => 'Example images for this document',
            'items' => [
              '$ref' => '#/components/schemas/ExampleImage',
            ],
          ],
          'examples_subtitle' => [
            'type' => 'string',
            'description' => 'Caption for the example images',
            'example' => 'Example of a valid certificate',
          ],
        ],
        'required' => ['title', 'subtitle'],
      ],
      'ExampleImage' => [
        'type' => 'object',
        'description' => 'An example image file',
        'properties' => [
          'fid' => [
            'type' => 'integer',
            'description' => 'The file ID',
            'example' => 123,
          ],
          'uuid' => [
            'type' => 'string',
            'description' => 'The file UUID',
            'example' => '123e4567-e89b-12d3-a456-426614174000',
          ],
          'filename' => [
            'type' => 'string',
            'description' => 'The filename',
            'example' => 'certificate-example.webp',
          ],
          'url' => [
            'type' => 'string',
            'format' => 'uri',
            'description' => 'The absolute URL to the file',
            'example' => 'https://example.com/sites/default/files/application_instructions/examples/certificate-example.webp',
          ],
          'size' => [
            'type' => 'integer',
            'description' => 'File size in bytes',
            'example' => 45678,
          ],
          'mime_type' => [
            'type' => 'string',
            'description' => 'The MIME type of the file',
            'example' => 'image/webp',
          ],
        ],
        'required' => ['fid', 'uuid', 'filename', 'url', 'size', 'mime_type'],
      ],
      'Error' => [
        'type' => 'object',
        'description' => 'Error response structure',
        'properties' => [
          'error' => [
            'type' => 'string',
            'description' => 'Error type or code',
            'example' => 'not_found',
          ],
          'message' => [
            'type' => 'string',
            'description' => 'Human-readable error message',
            'example' => 'The requested resource was not found.',
          ],
          'status' => [
            'type' => 'integer',
            'description' => 'HTTP status code',
            'example' => 404,
          ],
          'timestamp' => [
            'type' => 'integer',
            'description' => 'Unix timestamp when the error occurred',
            'example' => 1704067200,
          ],
        ],
        'required' => ['error', 'message', 'status'],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    return [
      '/api/v1/application/instructions' => [
        'get' => [
          'summary' => 'Get application instructions',
          'description' => 'Retrieves the application instructions including document requirements and example images.',
          'operationId' => 'rest_framework.application_instructions_get',
          'tags' => ['Application'],
          'parameters' => [
            [
              'name' => 'X-Language',
              'in' => 'header',
              'required' => TRUE,
              'schema' => [
                'type' => 'string',
                'enum' => ['en', 'sw'],
                'default' => 'en',
              ],
              'description' => 'Language code for localized content. Configuration will be loaded in the specified language.',
              'example' => 'en',
            ],
          ],
          'responses' => [
            '200' => [
              'description' => 'Application instructions retrieved successfully',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/ApplicationInstructionsResponse',
                  ],
                  'example' => [
                    'data' => [
                      'id' => 'application_instructions',
                      'type' => 'application_instructions',
                      'title' => 'Application Instructions',
                      'body' => [
                        'value' => '<p>Please follow these instructions carefully when submitting your application.</p>',
                        'format' => 'basic_html',
                        'processed' => '<p>Please follow these instructions carefully when submitting your application.</p>',
                      ],
                      'documents_required' => [
                        [
                          'title' => 'Valid group registration certificate',
                          'subtitle' => [
                            'value' => '<p>Must be issued within the last 6 months.</p>',
                            'format' => 'basic_html',
                            'processed' => '<p>Must be issued within the last 6 months.</p>',
                          ],
                          'link' => [
                            'uri' => 'https://example.com/certificate-info',
                            'title' => 'More info about certificates',
                          ],
                          'example_images' => [
                            [
                              'fid' => 123,
                              'uuid' => '123e4567-e89b-12d3-a456-426614174000',
                              'filename' => 'certificate-example.webp',
                              'url' => 'https://example.com/sites/default/files/application_instructions/examples/certificate-example.webp',
                              'size' => 45678,
                              'mime_type' => 'image/webp',
                            ],
                          ],
                          'examples_subtitle' => 'Example of a valid certificate',
                        ],
                      ],
                      'language' => [
                        'code' => 'en',
                        'name' => 'English',
                        'direction' => 'ltr',
                      ],
                      'url' => 'https://example.com/api/v1/application/instructions',
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
                            'url' => 'https://example.com/api/v1/application/instructions',
                            'path' => '/api/v1/application/instructions',
                          ],
                        ],
                      ],
                    ],
                  ],
                ],
              ],
            ],
            '400' => [
              'description' => 'Bad request - Invalid language code',
              'content' => [
                'application/json' => [
                  'schema' => [
                    'type' => 'object',
                    'properties' => [
                      'error' => [
                        'type' => 'string',
                        'example' => 'Invalid language code',
                      ],
                      'message' => [
                        'type' => 'string',
                        'example' => 'Language code "fr" is not supported. Available languages: en, sw',
                      ],
                      'available_languages' => [
                        'type' => 'array',
                        'items' => [
                          'type' => 'string',
                        ],
                        'example' => ['en', 'sw'],
                      ],
                    ],
                  ],
                ],
              ],
            ],
            '404' => [
              'description' => 'Instructions not found',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/Error',
                  ],
                ],
              ],
            ],
            '500' => [
              'description' => 'Internal server error',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/Error',
                  ],
                ],
              ],
            ],
          ],
          'security' => [],
        ],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getTags(): array {
    return [
      [
        'name' => 'Application',
        'description' => 'Application related endpoints',
      ],
    ];
  }

}
