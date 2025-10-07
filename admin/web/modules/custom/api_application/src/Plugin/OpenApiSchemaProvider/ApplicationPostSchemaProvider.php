<?php

namespace Drupal\api_application\Plugin\OpenApiSchemaProvider;

use Drupal\api_application\ApplicationStatusConstants;
use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema for Application POST endpoint.
 *
 * @OpenApiSchemaProvider(
 *   id = "application_post",
 *   label = @Translation("Application POST Schema"),
 * )
 */
class ApplicationPostSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    return [
      'ApplicationPostRequest' => [
        'type' => 'object',
        'description' => 'Request body for creating or updating an application. When identifier_type is EMAIL or NAME, use owner_identifier. When identifier_type is PHONE, use phoneNumber.',
        'required' => ['group_name', 'group_registration_number', 'date_registered', 'identifier_type'],
        'properties' => [
          'application_id' => [
            'type' => 'string',
            'description' => 'Existing application ID for updates (optional)',
            'example' => 'APP-20240115-abc12',
          ],
          'identifier_type' => [
            'type' => 'string',
            'description' => 'Type of identifier used to identify the application owner',
            'enum' => ['EMAIL', 'PHONE', 'NAME'],
            'example' => 'EMAIL',
          ],
          'owner_identifier' => [
            'type' => 'string',
            'description' => 'Identifier of the application owner (email or name, used when identifier_type is EMAIL or NAME)',
            'example' => 'user@example.com',
          ],
          'phone_number' => [
            'type' => 'string',
            'description' => 'Phone number of the application owner (used when identifier_type is PHONE)',
            'example' => '+254712345678',
          ],
          'status' => [
            'type' => 'string',
            'description' => 'Application status',
            'enum' => ApplicationStatusConstants::getAll(),
            'default' => ApplicationStatusConstants::DRAFT,
          ],
          'group_name' => [
            'type' => 'string',
            'description' => 'Name of the group',
            'example' => 'Youth Empowerment Group',
          ],
          'group_registration_number' => [
            'type' => 'string',
            'description' => 'Official registration number',
            'example' => 'REG-2024-001',
          ],
          'date_registered' => [
            'type' => 'string',
            'format' => 'date',
            'description' => 'Date when group was registered',
            'example' => '2024-01-15',
          ],
          'group_registration_certificate' => [
            '$ref' => '#/components/schemas/FileUpload',
          ],
          'list_of_members_certificate' => [
            '$ref' => '#/components/schemas/FileUpload',
          ],
          'group_background' => [
            'type' => 'array',
            'description' => 'Group background categories (taxonomy term names or IDs, auto-creates if not found)',
            'items' => [
              'oneOf' => [
                ['type' => 'string'],
                ['type' => 'integer'],
              ],
            ],
            'example' => ['Welfare issues', 'Income generating activities'],
          ],
          'key_activities' => [
            'type' => 'array',
            'description' => 'Key activities of the group',
            'items' => [
              'type' => 'string',
              'enum' => ['value_chain', 'table_banking', 'other'],
            ],
          ],
          'value_chain' => [
            'type' => 'array',
            'description' => 'Value chain categories (auto-creates if not found)',
            'items' => [
              'oneOf' => [
                ['type' => 'string'],
                ['type' => 'integer'],
              ],
            ],
          ],
          'table_banking_duration' => [
            'type' => 'string',
            'description' => 'Duration of table banking practice',
          ],
          'monthly_share_contribution' => [
            'type' => 'integer',
            'description' => 'Monthly share contribution amount',
          ],
          'total_amount_loaned' => [
            'type' => 'integer',
            'description' => 'Total amount loaned out',
          ],
          'total_revolving_fund' => [
            'type' => 'integer',
            'description' => 'Total revolving fund amount',
          ],
          'other_activities' => [
            'type' => 'string',
            'description' => 'Other activities description',
          ],
          'group_credit_history' => [
            'type' => 'array',
            'description' => 'Group credit history documents (multiple files allowed)',
            'items' => [
              '$ref' => '#/components/schemas/FileUpload',
            ],
          ],
          'county' => [
            'oneOf' => [
              ['type' => 'string', 'description' => 'County name (auto-creates if not found)'],
              ['type' => 'integer', 'description' => 'County taxonomy ID'],
            ],
          ],
          'constituency' => [
            'oneOf' => [
              ['type' => 'string', 'description' => 'Constituency name (auto-creates if not found)'],
              ['type' => 'integer', 'description' => 'Constituency taxonomy ID'],
            ],
          ],
          'ward' => [
            'type' => 'string',
            'description' => 'Ward name',
          ],
          'meeting_point' => [
            'type' => 'string',
            'description' => 'Where the group meets',
          ],
          'nearest_landmark' => [
            'type' => 'string',
            'description' => 'Nearest landmark to meeting point',
          ],
          'nature_of_group' => [
            'type' => 'string',
            'enum' => ['youth', 'pwd', 'women'],
            'description' => 'Nature of the group',
          ],
          'group_members' => [
            'type' => 'array',
            'description' => 'Group members',
            'items' => [
              '$ref' => '#/components/schemas/GroupMemberInput',
            ],
          ],
          'purpose_of_loan' => [
            'oneOf' => [
              ['type' => 'string', 'description' => 'Purpose name (auto-creates if not found)'],
              ['type' => 'integer', 'description' => 'Purpose taxonomy ID'],
            ],
          ],
          'loan_type' => [
            'oneOf' => [
              ['type' => 'string', 'description' => 'Loan type name (auto-creates if not found)'],
              ['type' => 'integer', 'description' => 'Loan type taxonomy ID'],
            ],
          ],
          'loan_amount' => [
            'type' => 'integer',
            'description' => 'Requested loan amount in KSh',
            'minimum' => 0,
          ],
          'proposed_repayment_period' => [
            'type' => 'integer',
            'description' => 'Repayment period in months',
            'minimum' => 1,
            'maximum' => 12,
          ],
          'bank_name' => [
            'oneOf' => [
              ['type' => 'string', 'description' => 'Bank name (auto-creates if not found)'],
              ['type' => 'integer', 'description' => 'Bank taxonomy ID'],
            ],
          ],
          'bank_branch' => [
            'type' => 'string',
            'description' => 'Bank branch name',
          ],
          'bank_account_number' => [
            'type' => 'string',
            'description' => 'Bank account number',
          ],
          'nature_of_business' => [
            'type' => 'string',
            'enum' => ['startup', 'expansion'],
            'description' => 'Nature of business',
          ],
          'business_type' => [
            'type' => 'array',
            'description' => 'Business type categories (auto-creates if not found)',
            'items' => [
              'oneOf' => [
                ['type' => 'string'],
                ['type' => 'integer'],
              ],
            ],
          ],
          'years_in_operation' => [
            'type' => 'number',
            'format' => 'float',
            'description' => 'Years in operation',
            'minimum' => 0,
          ],
          'average_income' => [
            'type' => 'integer',
            'description' => 'Average monthly income in KES',
            'minimum' => 0,
          ],
          'expenses' => [
            'type' => 'array',
            'description' => 'Business expenses',
            'items' => [
              'type' => 'object',
              'additionalProperties' => TRUE,
            ],
          ],
        ],
      ],
      'GroupMemberInput' => [
        'type' => 'object',
        'required' => ['name', 'id_number', 'gender', 'phone_number'],
        'properties' => [
          'name' => [
            'type' => 'string',
            'description' => 'Member full name',
          ],
          'id_number' => [
            'type' => 'string',
            'description' => 'National ID number',
          ],
          'gender' => [
            'type' => 'string',
            'enum' => ['male', 'female', 'other'],
          ],
          'phone_number' => [
            'type' => 'string',
            'description' => 'Phone number',
          ],
          'position' => [
            'oneOf' => [
              ['type' => 'string', 'description' => 'Position name (auto-creates if not found)'],
              ['type' => 'integer', 'description' => 'Position taxonomy ID'],
            ],
          ],
          'photo_member_id' => [
            '$ref' => '#/components/schemas/FileUpload',
          ],
          'person_with_disability' => [
            'type' => 'boolean',
            'default' => FALSE,
          ],
          'requires_confirmation' => [
            'type' => 'boolean',
            'default' => TRUE,
            'description' => 'Whether this member requires SMS confirmation',
          ],
          'pwd_number' => [
            'type' => 'string',
            'description' => 'PWD registration number',
          ],
          'certificate_disability' => [
            '$ref' => '#/components/schemas/FileUpload',
          ],
        ],
      ],
      'FileUpload' => [
        'oneOf' => [
          [
            'type' => 'integer',
            'description' => 'File ID reference',
          ],
          [
            'type' => 'string',
            'format' => 'uuid',
            'description' => 'File UUID reference',
          ],
          [
            'type' => 'object',
            'required' => ['filename', 'data'],
            'properties' => [
              'filename' => [
                'type' => 'string',
                'description' => 'File name',
                'example' => 'certificate.pdf',
              ],
              'data' => [
                'type' => 'string',
                'format' => 'base64',
                'description' => 'Base64 encoded file content',
              ],
            ],
          ],
        ],
      ],
      'ApplicationPostResponse' => [
        'type' => 'object',
        'properties' => [
          'success' => [
            'type' => 'boolean',
            'example' => TRUE,
          ],
          'message' => [
            'type' => 'string',
            'example' => 'Application created successfully',
          ],
          'data' => [
            'type' => 'object',
            'properties' => [
              'id' => [
                'type' => 'integer',
                'description' => 'Entity ID',
              ],
              'uuid' => [
                'type' => 'string',
                'format' => 'uuid',
                'description' => 'Entity UUID',
              ],
              'application_id' => [
                'type' => 'string',
                'description' => 'Application ID',
                'example' => 'APP-20240115-abc12',
              ],
              'status' => [
                'type' => 'string',
                'description' => 'Application status',
              ],
              'group_name' => [
                'type' => 'string',
                'description' => 'Group name',
              ],
              'created' => [
                'type' => 'integer',
                'description' => 'Creation timestamp',
              ],
              'changed' => [
                'type' => 'integer',
                'description' => 'Last modified timestamp',
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
          'missing_fields' => [
            'type' => 'array',
            'items' => [
              'type' => 'string',
            ],
            'description' => 'List of missing required fields',
          ],
        ],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    return [
      '/api/v1/application' => [
        'post' => [
          'summary' => 'Create or update a loan application',
          'description' => 'Creates a new loan application or updates an existing one if application_id or group_registration_number matches. Uses identifier_type with either owner_identifier (for EMAIL/NAME) or phoneNumber (for PHONE) to find or create the application owner in field_phone_number',
          'operationId' => 'createApplication',
          'tags' => ['Application'],
          'security' => [
            ['api_key' => []],
          ],
          'requestBody' => [
            'required' => TRUE,
            'content' => [
              'application/json' => [
                'schema' => [
                  '$ref' => '#/components/schemas/ApplicationPostRequest',
                ],
              ],
            ],
          ],
          'responses' => [
            '201' => [
              'description' => 'Application created or updated successfully',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/ApplicationPostResponse',
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
            '401' => [
              'description' => 'Unauthorized - invalid or missing API key',
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
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getSecurityDefinitions(): array {
    return [
      'api_key' => [
        'type' => 'apiKey',
        'in' => 'header',
        'name' => 'X-API-Key',
        'description' => 'API key for authentication. Configure in Application Settings.',
      ],
    ];
  }

}
