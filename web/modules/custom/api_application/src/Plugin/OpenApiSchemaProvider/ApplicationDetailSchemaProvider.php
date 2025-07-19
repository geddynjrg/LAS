<?php

namespace Drupal\api_application\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema for Application Detail endpoint.
 *
 * @OpenApiSchemaProvider(
 *   id = "application_detail",
 *   label = @Translation("Application Detail Schema"),
 * )
 */
class ApplicationDetailSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    return [
      'ApplicationDetailResponse' => [
        'type' => 'object',
        'properties' => [
          'success' => [
            'type' => 'boolean',
            'example' => TRUE,
          ],
          'data' => [
            '$ref' => '#/components/schemas/ApplicationDetail',
          ],
        ],
      ],
      'ApplicationDetail' => [
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
            'enum' => ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'closed'],
          ],
          'created' => [
            'type' => 'integer',
            'description' => 'Creation timestamp',
          ],
          'changed' => [
            'type' => 'integer',
            'description' => 'Last modified timestamp',
          ],
          'owner' => [
            'type' => 'object',
            'properties' => [
              'id' => [
                'type' => 'integer',
                'description' => 'User ID',
              ],
              'email' => [
                'type' => 'string',
                'format' => 'email',
                'description' => 'User email',
              ],
              'name' => [
                'type' => 'string',
                'description' => 'User name',
              ],
            ],
          ],
          'group_data' => [
            'type' => 'object',
            'properties' => [
              'group_name' => [
                'type' => 'string',
              ],
              'group_registration_number' => [
                'type' => 'string',
              ],
              'date_registered' => [
                'type' => 'string',
                'format' => 'date',
              ],
              'group_registration_certificate' => [
                '$ref' => '#/components/schemas/FileData',
              ],
              'list_of_members_certificate' => [
                '$ref' => '#/components/schemas/FileData',
              ],
              'group_background' => [
                'type' => 'array',
                'items' => [
                  '$ref' => '#/components/schemas/TaxonomyTerm',
                ],
              ],
              'key_activities' => [
                'type' => 'array',
                'items' => [
                  'type' => 'string',
                ],
              ],
              'value_chain' => [
                'type' => 'array',
                'items' => [
                  '$ref' => '#/components/schemas/TaxonomyTerm',
                ],
              ],
              'table_banking_duration' => [
                'type' => 'string',
                'nullable' => TRUE,
              ],
              'monthly_share_contribution' => [
                'type' => 'integer',
                'nullable' => TRUE,
              ],
              'total_amount_loaned' => [
                'type' => 'integer',
                'nullable' => TRUE,
              ],
              'total_revolving_fund' => [
                'type' => 'integer',
                'nullable' => TRUE,
              ],
              'other_activities' => [
                'type' => 'string',
                'nullable' => TRUE,
              ],
              'group_credit_history' => [
                'type' => 'array',
                'description' => 'Group credit history documents',
                'items' => [
                  '$ref' => '#/components/schemas/FileData',
                ],
              ],
            ],
          ],
          'location' => [
            'type' => 'object',
            'properties' => [
              'county' => [
                '$ref' => '#/components/schemas/TaxonomyTerm',
              ],
              'constituency' => [
                '$ref' => '#/components/schemas/TaxonomyTerm',
              ],
              'ward' => [
                'type' => 'string',
              ],
              'meeting_point' => [
                'type' => 'string',
              ],
              'nearest_landmark' => [
                'type' => 'string',
              ],
            ],
          ],
          'nature_of_group' => [
            'type' => 'string',
            'enum' => ['youth', 'pwd', 'women'],
          ],
          'group_members' => [
            'type' => 'array',
            'items' => [
              '$ref' => '#/components/schemas/GroupMemberDetail',
            ],
          ],
          'loan_conditions' => [
            'type' => 'object',
            'properties' => [
              'purpose_of_loan' => [
                '$ref' => '#/components/schemas/TaxonomyTerm',
              ],
              'loan_type' => [
                '$ref' => '#/components/schemas/TaxonomyTerm',
              ],
              'loan_amount' => [
                'type' => 'integer',
              ],
              'proposed_repayment_period' => [
                'type' => 'integer',
              ],
              'bank_name' => [
                '$ref' => '#/components/schemas/TaxonomyTerm',
              ],
              'bank_branch' => [
                'type' => 'string',
              ],
              'bank_account_number' => [
                'type' => 'string',
              ],
            ],
          ],
          'proposed_business' => [
            'type' => 'object',
            'properties' => [
              'nature_of_business' => [
                'type' => 'string',
                'enum' => ['startup', 'expansion'],
              ],
              'business_type' => [
                'type' => 'array',
                'items' => [
                  '$ref' => '#/components/schemas/TaxonomyTerm',
                ],
              ],
              'years_in_operation' => [
                'type' => 'number',
                'format' => 'float',
              ],
              'average_income' => [
                'type' => 'integer',
              ],
              'expenses' => [
                'type' => 'array',
                'items' => [
                  'type' => 'object',
                  'additionalProperties' => TRUE,
                ],
              ],
            ],
          ],
          'rejection_details' => [
            'type' => 'object',
            'nullable' => TRUE,
            'properties' => [
              'rejection_reason' => [
                'type' => 'string',
                'enum' => [
                  'incomplete_information',
                  'missing_documents',
                  'eligibility_criteria',
                  'duplicate_application',
                  'insufficient_collateral',
                  'poor_credit_history',
                  'other',
                ],
              ],
              'rejection_message' => [
                'type' => 'string',
              ],
            ],
          ],
        ],
      ],
      'GroupMemberDetail' => [
        'type' => 'object',
        'properties' => [
          'id' => [
            'type' => 'integer',
            'description' => 'Member entity ID',
          ],
          'name' => [
            'type' => 'string',
          ],
          'id_number' => [
            'type' => 'string',
          ],
          'gender' => [
            'type' => 'string',
            'enum' => ['male', 'female', 'other'],
          ],
          'phone_number' => [
            'type' => 'string',
          ],
          'position' => [
            '$ref' => '#/components/schemas/TaxonomyTerm',
          ],
          'photo_member_id' => [
            '$ref' => '#/components/schemas/FileData',
          ],
          'person_with_disability' => [
            'type' => 'boolean',
          ],
          'pwd_number' => [
            'type' => 'string',
            'nullable' => TRUE,
          ],
          'certificate_disability' => [
            '$ref' => '#/components/schemas/FileData',
          ],
        ],
      ],
      'TaxonomyTerm' => [
        'type' => 'object',
        'nullable' => TRUE,
        'properties' => [
          'tid' => [
            'type' => 'integer',
            'description' => 'Term ID',
          ],
          'name' => [
            'type' => 'string',
            'description' => 'Term name',
          ],
          'vocabulary' => [
            'type' => 'string',
            'description' => 'Vocabulary machine name',
          ],
        ],
      ],
      'FileData' => [
        'type' => 'object',
        'nullable' => TRUE,
        'properties' => [
          'fid' => [
            'type' => 'integer',
            'description' => 'File ID',
          ],
          'uuid' => [
            'type' => 'string',
            'format' => 'uuid',
            'description' => 'File UUID',
          ],
          'filename' => [
            'type' => 'string',
            'description' => 'File name',
          ],
          'url' => [
            'type' => 'string',
            'format' => 'uri',
            'description' => 'File URL',
          ],
          'size' => [
            'type' => 'integer',
            'description' => 'File size in bytes',
          ],
          'mime_type' => [
            'type' => 'string',
            'description' => 'MIME type',
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
      '/api/v1/application/{application_id}' => [
        'get' => [
          'summary' => 'Get application details',
          'description' => 'Retrieve full details of a loan application by ID, UUID, or application_id',
          'operationId' => 'getApplication',
          'tags' => ['Application'],
          'security' => [
            ['api_key' => []],
          ],
          'parameters' => [
            [
              'name' => 'application_id',
              'in' => 'path',
              'required' => TRUE,
              'description' => 'Application identifier (entity ID, UUID, or application_id)',
              'schema' => [
                'type' => 'string',
                'example' => 'APP-20240115-abc12',
              ],
            ],
          ],
          'responses' => [
            '200' => [
              'description' => 'Application details retrieved successfully',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/ApplicationDetailResponse',
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
