<?php

namespace Drupal\api_application\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema for Application List endpoint.
 *
 * @OpenApiSchemaProvider(
 *   id = "application_list",
 *   label = @Translation("Application List Schema"),
 * )
 */
class ApplicationListSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    return [
      'ApplicationListResponse' => [
        'type' => 'object',
        'properties' => [
          'success' => [
            'type' => 'boolean',
            'example' => TRUE,
          ],
          'data' => [
            'type' => 'array',
            'items' => [
              '$ref' => '#/components/schemas/ApplicationDetail',
            ],
          ],
          'meta' => [
            '$ref' => '#/components/schemas/PaginationMeta',
          ],
          'user' => [
            '$ref' => '#/components/schemas/UserInfo',
          ],
        ],
      ],

      'PaginationMeta' => [
        'type' => 'object',
        'properties' => [
          'total_count' => [
            'type' => 'integer',
            'description' => 'Total number of applications',
            'example' => 25,
          ],
          'limit' => [
            'type' => 'integer',
            'description' => 'Number of items per page',
            'example' => 20,
          ],
          'offset' => [
            'type' => 'integer',
            'description' => 'Number of items to skip',
            'example' => 0,
          ],
          'has_more' => [
            'type' => 'boolean',
            'description' => 'Whether there are more items available',
            'example' => TRUE,
          ],
        ],
      ],
      'UserInfo' => [
        'type' => 'object',
        'properties' => [
          'id' => [
            'type' => 'integer',
            'description' => 'User ID',
          ],
          'name' => [
            'type' => 'string',
            'description' => 'User name',
            'example' => 'john.doe',
          ],
          'email' => [
            'type' => 'string',
            'format' => 'email',
            'description' => 'User email',
            'example' => 'john.doe@example.com',
          ],
        ],
      ],
      'ApplicationListError' => [
        'type' => 'object',
        'properties' => [
          'error' => [
            'type' => 'string',
            'description' => 'Error type',
            'example' => 'Authentication failed',
          ],
          'message' => [
            'type' => 'string',
            'description' => 'Error message',
            'example' => 'Authentication required',
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
      '/api/v1/applications' => [
        'get' => [
          'tags' => ['Applications'],
          'summary' => 'Get list of current user applications',
          'description' => 'Retrieve a paginated list of applications for the authenticated user. Supports filtering by status and application ID.',
          'security' => [
            [
              'bearerAuth' => [],
            ],
          ],
          'parameters' => [
            [
              'name' => 'status',
              'in' => 'query',
              'required' => FALSE,
              'schema' => [
                'type' => 'string',
                'enum' => ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed', 'closed'],
              ],
              'description' => 'Filter applications by status',
              'example' => 'submitted',
            ],
            [
              'name' => 'application_id',
              'in' => 'query',
              'required' => FALSE,
              'schema' => [
                'type' => 'string',
              ],
              'description' => 'Filter applications by application ID',
              'example' => 'APP-20240115-abc12',
            ],
            [
              'name' => 'limit',
              'in' => 'query',
              'required' => FALSE,
              'schema' => [
                'type' => 'integer',
                'minimum' => 1,
                'maximum' => 100,
                'default' => 20,
              ],
              'description' => 'Number of applications to return per page',
              'example' => 20,
            ],
            [
              'name' => 'offset',
              'in' => 'query',
              'required' => FALSE,
              'schema' => [
                'type' => 'integer',
                'minimum' => 0,
                'default' => 0,
              ],
              'description' => 'Number of applications to skip',
              'example' => 0,
            ],
          ],
          'responses' => [
            '200' => [
              'description' => 'List of applications retrieved successfully',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/ApplicationListResponse',
                  ],
                  'examples' => [
                    'success' => [
                      'summary' => 'Successful response',
                      'value' => [
                        'success' => TRUE,
                        'data' => [
                          [
                            'id' => 123,
                            'uuid' => '550e8400-e29b-41d4-a716-446655440000',
                            'application_id' => 'APP-20240115-abc12',
                            'status' => 'submitted',
                            'created' => 1705312800,
                            'changed' => 1705399200,
                            'owner' => [
                              'id' => 456,
                              'email' => 'john.doe@example.com',
                              'name' => 'john.doe',
                            ],
                            'group_data' => [
                              'group_name' => 'Uwezo Women Group',
                              'group_registration_number' => 'REG-12345',
                              'date_registered' => '2024-01-01',
                              'group_registration_certificate' => NULL,
                              'list_of_members_certificate' => NULL,
                              'group_background' => [],
                              'key_activities' => ['farming', 'trading'],
                              'value_chain' => [],
                              'table_banking_duration' => '12 months',
                              'monthly_share_contribution' => 1000,
                              'total_amount_loaned' => 50000,
                              'total_revolving_fund' => 75000,
                              'other_activities' => 'Community development',
                              'group_credit_history' => [],
                            ],
                            'location' => [
                              'county' => [
                                'tid' => 1,
                                'name' => 'Nairobi',
                                'vocabulary' => 'counties',
                              ],
                              'constituency' => [
                                'tid' => 2,
                                'name' => 'Westlands',
                                'vocabulary' => 'constituencies',
                              ],
                              'ward' => 'Kitisuru',
                              'meeting_point' => 'Community Hall',
                              'nearest_landmark' => 'Local Market',
                            ],
                            'group_members' => [
                              [
                                'id' => 789,
                                'name' => 'Jane Doe',
                                'id_number' => '12345678',
                                'gender' => 'female',
                                'phone_number' => '+254700123456',
                                'position' => [
                                  'tid' => 3,
                                  'name' => 'Chairperson',
                                  'vocabulary' => 'member_positions',
                                ],
                                'photo_member_id' => NULL,
                                'person_with_disability' => FALSE,
                                'requires_confirmation' => TRUE,
                                'confirmation' => [
                                  'status' => 'confirmed',
                                  'sent_at' => 1705312800,
                                  'confirmed_at' => 1705399200,
                                  'is_confirmed' => TRUE,
                                  'is_declined' => FALSE,
                                  'urls' => [
                                    'api' => 'https://example.com/api/confirm/xyz',
                                    'frontend' => 'https://example.com/confirm/xyz',
                                    'sms' => 'https://example.com/confirm/xyz',
                                  ],
                                ],
                              ],
                            ],
                            'nature_of_group' => 'women_group',
                            'loan_conditions' => [
                              'purpose_of_loan' => [
                                'tid' => 4,
                                'name' => 'Business Expansion',
                                'vocabulary' => 'loan_purposes',
                              ],
                              'loan_type' => [
                                'tid' => 5,
                                'name' => 'Group Loan',
                                'vocabulary' => 'loan_types',
                              ],
                              'loan_amount' => 50000,
                              'proposed_repayment_period' => 12,
                              'bank_name' => [
                                'tid' => 6,
                                'name' => 'Equity Bank',
                                'vocabulary' => 'banks',
                              ],
                              'bank_branch' => 'Westlands Branch',
                              'bank_account_number' => '1234567890',
                            ],
                            'proposed_business' => [
                              'nature_of_business' => 'retail_trade',
                              'business_type' => [],
                              'years_in_operation' => 2.5,
                              'average_income' => 15000,
                              'expenses' => [
                                [
                                  'rent' => '5000',
                                  'utilities' => '2000',
                                  'stock' => '8000',
                                ],
                              ],
                            ],
                          ],
                        ],
                        'meta' => [
                          'total_count' => 1,
                          'limit' => 20,
                          'offset' => 0,
                          'has_more' => FALSE,
                        ],
                        'user' => [
                          'id' => 456,
                          'name' => 'john.doe',
                          'email' => 'john.doe@example.com',
                        ],
                      ],
                    ],
                  ],
                ],
              ],
            ],
            '400' => [
              'description' => 'Bad request - invalid parameters',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/ApplicationListError',
                  ],
                  'examples' => [
                    'invalid_params' => [
                      'summary' => 'Invalid parameters',
                      'value' => [
                        'error' => 'Invalid request',
                        'message' => 'Invalid query parameters',
                      ],
                    ],
                  ],
                ],
              ],
            ],
            '401' => [
              'description' => 'Authentication failed',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/ApplicationListError',
                  ],
                  'examples' => [
                    'auth_failed' => [
                      'summary' => 'Authentication failed',
                      'value' => [
                        'error' => 'Authentication failed',
                        'message' => 'Authentication required',
                      ],
                    ],
                    'invalid_token' => [
                      'summary' => 'Invalid or expired token',
                      'value' => [
                        'error' => 'Authentication failed',
                        'message' => 'Invalid or expired JWT token',
                      ],
                    ],
                  ],
                ],
              ],
            ],
            '404' => [
              'description' => 'User entity not found',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/ApplicationListError',
                  ],
                  'examples' => [
                    'user_not_found' => [
                      'summary' => 'User entity not found',
                      'value' => [
                        'error' => 'User not found',
                        'message' => 'User entity not found',
                      ],
                    ],
                  ],
                ],
              ],
            ],
            '500' => [
              'description' => 'Internal server error',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/ApplicationListError',
                  ],
                  'examples' => [
                    'server_error' => [
                      'summary' => 'Internal server error',
                      'value' => [
                        'error' => 'Internal server error',
                        'message' => 'An error occurred while retrieving the applications',
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
      ],
    ];
  }

}
