<?php

namespace Drupal\api_application\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema definitions for the Application PDF resource.
 *
 * @OpenApiSchemaProvider(
 *   id = "api_application_pdf",
 *   label = @Translation("API Application PDF Schema Provider"),
 * )
 */
class ApplicationPdfSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    $paths = [];

    // Define the Application PDF endpoint.
    $paths['/api/v1/application/{application}/pdf'] = [
      'get' => [
        'summary' => 'Download application as PDF',
        'description' => 'Generate and optionally download application PDF. Use download=true query parameter to download the file directly.',
        'operationId' => 'api_application_pdf',
        'tags' => ['Application'],
        'parameters' => [
          [
            'name' => 'application',
            'in' => 'path',
            'required' => TRUE,
            'description' => 'Application ID, UUID, or database ID',
            'schema' => [
              'type' => 'string',
              'example' => 'APP-123',
            ],
          ],
          [
            'name' => 'format',
            'in' => 'query',
            'required' => FALSE,
            'description' => 'Response format: metadata (default), download (file download), or blob (base64 encoded)',
            'schema' => [
              'type' => 'string',
              'enum' => ['metadata', 'download', 'blob', 'base64'],
              'default' => 'metadata',
            ],
          ],
          [
            'name' => 'download',
            'in' => 'query',
            'required' => FALSE,
            'description' => 'Legacy parameter: set to true to download file (equivalent to format=download)',
            'schema' => [
              'type' => 'string',
              'enum' => ['true', 'false'],
              'default' => 'false',
            ],
            'deprecated' => TRUE,
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'PDF response based on format parameter',
            'content' => [
              'application/json' => [
                'schema' => [
                  'oneOf' => [
                    ['$ref' => '#/components/schemas/PdfMetadataResponse'],
                    ['$ref' => '#/components/schemas/PdfBlobResponse'],
                  ],
                ],
              ],
              'application/pdf' => [
                'schema' => [
                  'type' => 'string',
                  'format' => 'binary',
                ],
              ],
            ],
          ],
          '400' => [
            'description' => 'Bad request - invalid application ID',
            'content' => [
              'application/json' => [
                'schema' => [
                  '$ref' => '#/components/schemas/ErrorResponse',
                ],
              ],
            ],
          ],
          '404' => [
            'description' => 'Application not found',
            'content' => [
              'application/json' => [
                'schema' => [
                  '$ref' => '#/components/schemas/ErrorResponse',
                ],
              ],
            ],
          ],
          '500' => [
            'description' => 'Internal server error',
            'content' => [
              'application/json' => [
                'schema' => [
                  '$ref' => '#/components/schemas/ErrorResponse',
                ],
              ],
            ],
          ],
        ],
      ],
    ];

    return $paths;
  }

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    return [
      'PdfMetadataResponse' => [
        'type' => 'object',
        'description' => 'PDF metadata response',
        'properties' => [
          'success' => [
            'type' => 'boolean',
            'description' => 'Whether the operation was successful',
            'example' => TRUE,
          ],
          'data' => [
            'type' => 'object',
            'properties' => [
              'application_id' => [
                'type' => 'string',
                'description' => 'Application ID',
                'example' => 'APP-123',
              ],
              'pdf_available' => [
                'type' => 'boolean',
                'description' => 'Whether PDF is available',
                'example' => TRUE,
              ],
              'download_url' => [
                'type' => 'string',
                'description' => 'URL to download the PDF',
                'example' => 'https://your-domain.com/api/v1/application/APP-123/pdf?format=download',
              ],
              'blob_url' => [
                'type' => 'string',
                'description' => 'URL to get PDF as base64 blob',
                'example' => 'https://your-domain.com/api/v1/application/APP-123/pdf?format=blob',
              ],
              'filename' => [
                'type' => 'string',
                'description' => 'PDF filename',
                'example' => 'application-APP-123.pdf',
              ],
            ],
          ],
        ],
      ],
      'PdfBlobResponse' => [
        'type' => 'object',
        'description' => 'PDF blob response with base64 encoded content',
        'properties' => [
          'success' => [
            'type' => 'boolean',
            'description' => 'Whether the operation was successful',
            'example' => TRUE,
          ],
          'data' => [
            'type' => 'object',
            'properties' => [
              'application_id' => [
                'type' => 'string',
                'description' => 'Application ID',
                'example' => 'APP-123',
              ],
              'filename' => [
                'type' => 'string',
                'description' => 'PDF filename',
                'example' => 'application-APP-123.pdf',
              ],
              'mime_type' => [
                'type' => 'string',
                'description' => 'MIME type of the PDF',
                'example' => 'application/pdf',
              ],
              'size' => [
                'type' => 'integer',
                'description' => 'File size in bytes',
                'example' => 1024000,
              ],
              'content' => [
                'type' => 'string',
                'description' => 'Base64 encoded PDF content',
                'example' => 'JVBERi0xLjQKJdPr6eEKMSAwIG9iag...',
              ],
            ],
          ],
        ],
      ],
      'ErrorResponse' => [
        'type' => 'object',
        'properties' => [
          'error' => [
            'type' => 'string',
            'description' => 'Error type',
          ],
          'message' => [
            'type' => 'string',
            'description' => 'Error message',
          ],
        ],
      ],
    ];
  }

}
