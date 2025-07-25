<?php

namespace Drupal\api_application\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema for Member Confirmation endpoint.
 *
 * @OpenApiSchemaProvider(
 *   id = "member_confirmation",
 *   label = @Translation("Member Confirmation Schema"),
 * )
 */
class MemberConfirmationSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    return [
      'MemberConfirmationSuccessResponse' => [
        'type' => 'object',
        'properties' => [
          'success' => [
            'type' => 'boolean',
            'example' => TRUE,
            'description' => 'Indicates if the confirmation was successful',
          ],
          'message' => [
            'type' => 'string',
            'example' => 'Membership confirmed successfully',
            'description' => 'Human-readable success message',
          ],
          'data' => [
            '$ref' => '#/components/schemas/MemberConfirmationData',
          ],
        ],
        'required' => ['success', 'message', 'data'],
      ],
      'MemberConfirmationData' => [
        'type' => 'object',
        'properties' => [
          'member' => [
            '$ref' => '#/components/schemas/ConfirmedMemberInfo',
          ],
          'application' => [
            '$ref' => '#/components/schemas/ConfirmedApplicationInfo',
          ],
          'action' => [
            'type' => 'string',
            'enum' => ['confirmed', 'declined'],
            'description' => 'The action that was taken (only present in POST responses)',
            'example' => 'confirmed',
          ],
          'confirmation_timestamp' => [
            'type' => 'integer',
            'description' => 'Unix timestamp when confirmation was processed',
            'example' => 1704067200,
          ],
        ],
        'required' => ['member', 'application', 'confirmation_timestamp'],
      ],
      'ConfirmedMemberInfo' => [
        'type' => 'object',
        'properties' => [
          'id' => [
            'type' => 'integer',
            'description' => 'Member entity ID',
            'example' => 123,
          ],
          'name' => [
            'type' => 'string',
            'description' => 'Member name',
            'example' => 'John Doe',
          ],
          'phone_number' => [
            'type' => 'string',
            'description' => 'Member phone number',
            'example' => '+254700123456',
          ],
          'confirmation_status' => [
            'type' => 'string',
            'enum' => ['confirmed', 'declined'],
            'description' => 'Updated confirmation status',
            'example' => 'confirmed',
          ],
          'confirmation_confirmed_at' => [
            'type' => 'integer',
            'description' => 'Unix timestamp when member confirmed',
            'example' => 1704067200,
          ],
        ],
        'required' => ['id', 'name', 'phone_number', 'confirmation_status', 'confirmation_confirmed_at'],
      ],
      'ConfirmedApplicationInfo' => [
        'type' => 'object',
        'properties' => [
          'id' => [
            'type' => 'integer',
            'nullable' => TRUE,
            'description' => 'Application entity ID',
            'example' => 456,
          ],
          'application_id' => [
            'type' => 'string',
            'nullable' => TRUE,
            'description' => 'Application identifier',
            'example' => 'APP-20240101-abc12',
          ],
          'group_name' => [
            'type' => 'string',
            'nullable' => TRUE,
            'description' => 'Name of the group',
            'example' => 'Savings Group Alpha',
          ],
        ],
      ],
      'MemberConfirmationErrorResponse' => [
        'type' => 'object',
        'properties' => [
          'success' => [
            'type' => 'boolean',
            'example' => FALSE,
            'description' => 'Indicates the request failed',
          ],
          'error' => [
            'type' => 'object',
            'properties' => [
              'message' => [
                'type' => 'string',
                'description' => 'Error message',
                'example' => 'Invalid or expired confirmation token',
              ],
              'code' => [
                'type' => 'integer',
                'description' => 'HTTP status code',
                'example' => 404,
              ],
            ],
            'required' => ['message', 'code'],
          ],
          'timestamp' => [
            'type' => 'integer',
            'description' => 'Unix timestamp when error occurred',
            'example' => 1704067200,
          ],
        ],
        'required' => ['success', 'error', 'timestamp'],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    return [
      '/api/v1/member/response/{token}' => [
        'get' => [
          'summary' => 'Process member response or get details',
          'description' => 'Process a member\'s response (confirm/decline) or get their current status using SMS confirmation token. Use ?action=confirmed or ?action=declined to process response, or no action parameter to just get details.',
          'operationId' => 'processMemberResponse',
          'tags' => ['Member Confirmation'],
          'parameters' => [
            [
              'name' => 'token',
              'in' => 'path',
              'required' => TRUE,
              'description' => 'SMS confirmation token (64-character hexadecimal string)',
              'schema' => [
                'type' => 'string',
                'pattern' => '^[a-f0-9]{64}$',
                'example' => 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
              ],
            ],
            [
              'name' => 'action',
              'in' => 'query',
              'required' => FALSE,
              'description' => 'Action to take: "confirmed" to accept, "declined" to decline, or omit to just get details',
              'schema' => [
                'type' => 'string',
                'enum' => ['confirmed', 'declined'],
                'example' => 'confirmed',
              ],
            ],
          ],
          'responses' => [
            '200' => [
              'description' => 'Success - either member details retrieved or response processed',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/MemberConfirmationSuccessResponse',
                  ],
                  'examples' => [
                    'info_only' => [
                      'summary' => 'Get member details (no action)',
                      'value' => [
                        'success' => TRUE,
                        'data' => [
                          'member' => [
                            'id' => 123,
                            'name' => 'John Doe',
                            'phone_number' => '+254700123456',
                            'confirmation_status' => 'pending',
                            'confirmation_sent_at' => 1704063600,
                            'confirmation_confirmed_at' => NULL,
                          ],
                          'application' => [
                            'id' => 456,
                            'application_id' => 'APP-20240101-abc12',
                            'group_name' => 'Savings Group Alpha',
                          ],
                        ],
                      ],
                    ],
                    'confirmed' => [
                      'summary' => 'Member confirmed participation',
                      'value' => [
                        'success' => TRUE,
                        'message' => 'Membership confirmed successfully',
                        'data' => [
                          'member' => [
                            'id' => 123,
                            'name' => 'John Doe',
                            'phone_number' => '+254700123456',
                            'confirmation_status' => 'confirmed',
                            'confirmation_confirmed_at' => 1704067200,
                          ],
                          'application' => [
                            'id' => 456,
                            'application_id' => 'APP-20240101-abc12',
                            'group_name' => 'Savings Group Alpha',
                          ],
                          'action' => 'confirmed',
                          'confirmation_timestamp' => 1704067200,
                        ],
                      ],
                    ],
                    'declined' => [
                      'summary' => 'Member declined participation',
                      'value' => [
                        'success' => TRUE,
                        'message' => 'Membership declined successfully',
                        'data' => [
                          'member' => [
                            'id' => 123,
                            'name' => 'John Doe',
                            'phone_number' => '+254700123456',
                            'confirmation_status' => 'declined',
                            'confirmation_confirmed_at' => 1704067200,
                          ],
                          'application' => [
                            'id' => 456,
                            'application_id' => 'APP-20240101-abc12',
                            'group_name' => 'Savings Group Alpha',
                          ],
                          'action' => 'declined',
                          'confirmation_timestamp' => 1704067200,
                        ],
                      ],
                    ],
                  ],
                ],
              ],
            ],
            '400' => [
              'description' => 'Invalid request - missing/malformed token or invalid action',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/MemberConfirmationErrorResponse',
                  ],
                  'examples' => [
                    'missing_token' => [
                      'summary' => 'Missing token',
                      'value' => [
                        'success' => FALSE,
                        'error' => [
                          'message' => 'Token parameter is required',
                          'code' => 400,
                        ],
                        'timestamp' => 1704067200,
                      ],
                    ],
                    'invalid_format' => [
                      'summary' => 'Invalid token format',
                      'value' => [
                        'success' => FALSE,
                        'error' => [
                          'message' => 'Invalid token format',
                          'code' => 400,
                        ],
                        'timestamp' => 1704067200,
                      ],
                    ],
                  ],
                ],
              ],
            ],
            '404' => [
              'description' => 'Token not found or expired',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/MemberConfirmationErrorResponse',
                  ],
                  'example' => [
                    'success' => FALSE,
                    'error' => [
                      'message' => 'Invalid or expired confirmation token',
                      'code' => 404,
                    ],
                    'timestamp' => 1704067200,
                  ],
                ],
              ],
            ],
            '500' => [
              'description' => 'Internal server error',
              'content' => [
                'application/json' => [
                  'schema' => [
                    '$ref' => '#/components/schemas/MemberConfirmationErrorResponse',
                  ],
                  'example' => [
                    'success' => FALSE,
                    'error' => [
                      'message' => 'An error occurred while processing confirmation',
                      'code' => 500,
                    ],
                    'timestamp' => 1704067200,
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
  public function getTags(): array {
    return [
      [
        'name' => 'Member Confirmation',
        'description' => 'Endpoints for confirming group member participation via SMS tokens',
      ],
    ];
  }

}
