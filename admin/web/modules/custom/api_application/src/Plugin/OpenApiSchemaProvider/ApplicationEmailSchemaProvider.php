<?php

namespace Drupal\api_application\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema definitions for the Application Email resource.
 *
 * @OpenApiSchemaProvider(
 *   id = "api_application_email",
 *   label = @Translation("API Application Email Schema Provider"),
 * )
 */
class ApplicationEmailSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    $paths = [];

    // Define the Application Email endpoint.
    $paths['/api/v1/application/{application}/email'] = [
      'post' => [
        'summary' => 'Send application via email',
        'description' => 'Send application PDF via email with optional custom subject and body',
        'operationId' => 'api_application_email',
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
        ],
        'requestBody' => [
          'required' => TRUE,
          'content' => [
            'application/json' => [
              'schema' => [
                '$ref' => '#/components/schemas/EmailRequest',
              ],
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'Email sent successfully',
            'content' => [
              'application/json' => [
                'schema' => [
                  '$ref' => '#/components/schemas/EmailSuccessResponse',
                ],
              ],
            ],
          ],
          '400' => [
            'description' => 'Bad request - validation failed',
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
      'EmailRequest' => [
        'type' => 'object',
        'description' => 'Email request body',
        'required' => ['email'],
        'properties' => [
          'email' => [
            'type' => 'string',
            'format' => 'email',
            'description' => 'Recipient email address',
            'example' => 'recipient@example.com',
          ],
          'subject' => [
            'type' => 'string',
            'description' => 'Optional custom email subject',
            'example' => 'Your Loan Application',
          ],
          'body' => [
            'type' => 'string',
            'description' => 'Optional custom email body',
            'example' => 'Please find your loan application attached.',
          ],
          'from' => [
            'type' => 'string',
            'format' => 'email',
            'description' => 'Optional sender email address',
            'example' => 'noreply@example.com',
          ],
        ],
      ],
      'EmailSuccessResponse' => [
        'type' => 'object',
        'description' => 'Email success response',
        'properties' => [
          'success' => [
            'type' => 'boolean',
            'description' => 'Whether the operation was successful',
            'example' => TRUE,
          ],
          'message' => [
            'type' => 'string',
            'description' => 'Success message',
            'example' => 'Application sent successfully',
          ],
          'data' => [
            'type' => 'object',
            'properties' => [
              'application_id' => [
                'type' => 'string',
                'description' => 'Application ID',
                'example' => 'APP-123',
              ],
              'recipient_email' => [
                'type' => 'string',
                'format' => 'email',
                'description' => 'Recipient email address',
                'example' => 'client@example.com',
              ],
              'sent_at' => [
                'type' => 'string',
                'format' => 'date-time',
                'description' => 'Timestamp when email was sent',
                'example' => '2025-01-16T10:30:00+00:00',
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
