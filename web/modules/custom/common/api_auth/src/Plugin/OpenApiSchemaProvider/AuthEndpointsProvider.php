<?php

namespace Drupal\api_auth\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema definitions for authentication endpoints.
 *
 * @OpenApiSchemaProvider(
 *     id="auth_endpoints",
 *     label=@Translation("Authentication Endpoints Provider"),
 *     priority=-7
 * )
 */
class AuthEndpointsProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function generateExample(string $path, string $method): ?array {
    // Only generate examples for paths this provider is responsible for.
    if (!isset($this->getPathDefinitions()[$path][$method])) {
      return NULL;
    }

    if ($path === '/api/v1/user/login' && $method === 'post') {
      return [
        'data' => [
          'access_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'refresh_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0eXBlIjoicmVmcmVzaCJ9.7UvX2q3U4YEvlbEYCVTcTUZqpP0n-k7i5UeOgRXdHLQ',
          'expires_in' => 3600,
          'token_type' => 'Bearer',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];
    }

    if ($path === '/api/v1/user/token/refresh' && $method === 'post') {
      return [
        'data' => [
          'access_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'refresh_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0eXBlIjoicmVmcmVzaCJ9.7UvX2q3U4YEvlbEYCVTcTUZqpP0n-k7i5UeOgRXdHLQ',
          'expires_in' => 3600,
          'token_type' => 'Bearer',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];
    }

    if ($path === '/api/v1/user/register' && $method === 'post') {
      return [
        'data' => [
          'mail' => 'user@example.com',
          'access_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'refresh_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0eXBlIjoicmVmcmVzaCJ9.7UvX2q3U4YEvlbEYCVTcTUZqpP0n-k7i5UeOgRXdHLQ',
          'expires_in' => 3600,
          'token_type' => 'Bearer',
          'status' => 'active',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];
    }

    if ($path === '/api/v1/user/password/reset-request' && $method === 'post') {
      return [
        'data' => [
          'message' => 'If the email exists, a password reset link has been sent.',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];
    }

    if ($path === '/api/v1/user/password/reset' && $method === 'post') {
      return [
        'data' => [
          'message' => 'Password has been reset successfully.',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];
    }

    if ($path === '/api/v1/user/profile' && $method === 'get') {
      return [
        'data' => [
          'email' => 'user@example.com',
          'name' => 'John Doe',
          'roles' => ['authenticated', 'student'],
          'created' => '2023-01-15T10:30:00+03:00',
          'last_access' => '2023-06-20T14:22:45+03:00',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];
    }

    if ($path === '/api/v1/user/logout' && $method === 'post') {
      return [
        'data' => [
          'message' => 'Successfully logged out',
          'removed_tokens' => 3,
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];
    }

    if ($path === '/api/auth/otp/request' && $method === 'post') {
      return [
        'data' => [
          'request_id' => 'req_abc123def456',
          'message' => 'OTP sent successfully',
          'expires_in' => 300,
          'phone_number' => '+254712***678',
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];
    }

    if ($path === '/api/auth/otp/verify' && $method === 'post') {
      return [
        'data' => [
          'access_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
          'refresh_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0eXBlIjoicmVmcmVzaCJ9.7UvX2q3U4YEvlbEYCVTcTUZqpP0n-k7i5UeOgRXdHLQ',
          'expires_in' => 3600,
          'token_type' => 'Bearer',
          'user' => [
            'id' => 123,
            'email' => 'user@example.com',
            'name' => 'user_254712345678',
            'phone_number' => '+254712345678',
            'created' => FALSE,
          ],
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];
    }

    return NULL;
  }

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    $components = [];

    // Define the authentication token schema component.
    $components['AuthTokens'] = [
      'type' => 'object',
      'properties' => [
        'access_token' => [
          'type' => 'string',
          'description' => 'JWT access token',
          'example' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        ],
        'refresh_token' => [
          'type' => 'string',
          'description' => 'JWT refresh token',
          'example' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        ],
        'expires_in' => [
          'type' => 'integer',
          'description' => 'Token expiration time in seconds',
          'example' => 3600,
        ],
        'token_type' => [
          'type' => 'string',
          'description' => 'Token type',
          'example' => 'Bearer',
        ],
      ],
      'required' => ['access_token', 'refresh_token', 'expires_in', 'token_type'],
    ];

    // Define the OTP request response schema component.
    $components['OtpRequest'] = [
      'type' => 'object',
      'properties' => [
        'request_id' => [
          'type' => 'string',
          'description' => 'Unique identifier for the OTP request',
          'example' => 'req_abc123def456',
        ],
        'message' => [
          'type' => 'string',
          'description' => 'Status message',
          'example' => 'OTP sent successfully',
        ],
        'expires_in' => [
          'type' => 'integer',
          'description' => 'OTP expiration time in seconds',
          'example' => 300,
        ],
        'phone_number' => [
          'type' => 'string',
          'description' => 'Phone number (masked for security)',
          'example' => '+254712***678',
        ],
      ],
      'required' => ['request_id', 'message', 'expires_in'],
    ];

    // Define the OTP verify response schema component.
    $components['OtpVerifyResponse'] = [
      'type' => 'object',
      'properties' => [
        'access_token' => [
          'type' => 'string',
          'description' => 'JWT access token',
          'example' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        ],
        'refresh_token' => [
          'type' => 'string',
          'description' => 'JWT refresh token',
          'example' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        ],
        'expires_in' => [
          'type' => 'integer',
          'description' => 'Token expiration time in seconds',
          'example' => 3600,
        ],
        'token_type' => [
          'type' => 'string',
          'description' => 'Token type',
          'example' => 'Bearer',
        ],
        'user' => [
          'type' => 'object',
          'properties' => [
            'id' => [
              'type' => 'integer',
              'description' => 'User ID',
              'example' => 123,
            ],
            'email' => [
              'type' => 'string',
              'format' => 'email',
              'description' => 'User email address',
              'example' => 'user@example.com',
            ],
            'name' => [
              'type' => 'string',
              'description' => 'Username',
              'example' => 'user_254712345678',
            ],
            'phone_number' => [
              'type' => 'string',
              'description' => 'User phone number',
              'example' => '+254712345678',
            ],
            'created' => [
              'type' => 'boolean',
              'description' => 'Whether this user was created during OTP verification',
              'example' => FALSE,
            ],
          ],
        ],
      ],
      'required' => ['access_token', 'refresh_token', 'expires_in', 'token_type', 'user'],
    ];

    return $components;
  }

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    $paths = [];

    // User Login endpoint.
    $paths['/api/v1/user/login'] = [
      'post' => [
        'summary' => 'Login',
        'description' => 'Authenticate a user and get access and refresh tokens.',
        'operationId' => 'api_auth.user_login',
        'requestBody' => [
          'required' => TRUE,
          'content' => [
            'application/json' => [
              'schema' => [
                'type' => 'object',
                'required' => ['username', 'password'],
                'properties' => [
                  'username' => [
                    'type' => 'string',
                    'description' => 'Username or email address',
                  ],
                  'password' => [
                    'type' => 'string',
                    'description' => 'User password',
                  ],
                ],
              ],
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'Login successful',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      '$ref' => '#/components/schemas/AuthTokens',
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
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
          '400' => [
            'description' => 'Invalid request parameters',
          ],
          '401' => [
            'description' => 'Invalid credentials',
          ],
        ],
        'tags' => ['Authentication'],
        'security' => [],
      ],
    ];

    // Token Refresh endpoint.
    $paths['/api/v1/user/token/refresh'] = [
      'post' => [
        'summary' => 'Refresh token',
        'description' => 'Get new access and refresh tokens using a refresh token.',
        'operationId' => 'api_auth.token_refresh',
        'requestBody' => [
          'required' => TRUE,
          'content' => [
            'application/json' => [
              'schema' => [
                'type' => 'object',
                'required' => ['refresh_token'],
                'properties' => [
                  'refresh_token' => [
                    'type' => 'string',
                    'description' => 'Refresh token',
                  ],
                ],
              ],
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'Token refresh successful',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      '$ref' => '#/components/schemas/AuthTokens',
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
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
          '400' => [
            'description' => 'Invalid request parameters',
          ],
          '401' => [
            'description' => 'Invalid or expired refresh token',
          ],
        ],
        'tags' => ['Authentication'],
        'security' => [],
      ],
    ];

    // User Registration endpoint.
    $paths['/api/v1/user/register'] = [
      'post' => [
        'summary' => 'Registration',
        'description' => 'Register a new user and get access and refresh tokens.',
        'operationId' => 'api_auth.user_register',
        'requestBody' => [
          'required' => TRUE,
          'content' => [
            'application/json' => [
              'schema' => [
                'type' => 'object',
                'required' => ['mail', 'name', 'pass'],
                'properties' => [
                  'mail' => [
                    'type' => 'array',
                    'items' => [
                      'type' => 'object',
                      'properties' => [
                        'value' => [
                          'type' => 'string',
                          'format' => 'email',
                          'description' => 'Email address',
                        ],
                      ],
                    ],
                  ],
                  'name' => [
                    'type' => 'array',
                    'items' => [
                      'type' => 'object',
                      'properties' => [
                        'value' => [
                          'type' => 'string',
                          'description' => 'Username',
                        ],
                      ],
                    ],
                  ],
                  'pass' => [
                    'type' => 'array',
                    'items' => [
                      'type' => 'object',
                      'properties' => [
                        'value' => [
                          'type' => 'string',
                          'description' => 'Password',
                        ],
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'Registration successful',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      'type' => 'object',
                      'properties' => [
                        'mail' => [
                          'type' => 'string',
                          'format' => 'email',
                          'description' => 'Email address of the registered user',
                        ],
                        'access_token' => [
                          'type' => 'string',
                          'description' => 'JWT access token',
                        ],
                        'refresh_token' => [
                          'type' => 'string',
                          'description' => 'JWT refresh token',
                        ],
                        'expires_in' => [
                          'type' => 'integer',
                          'description' => 'Token expiration time in seconds',
                        ],
                        'token_type' => [
                          'type' => 'string',
                          'description' => 'Token type',
                          'example' => 'Bearer',
                        ],
                        'status' => [
                          'type' => 'string',
                          'description' => 'User account status',
                          'example' => 'active',
                        ],
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
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
          '400' => [
            'description' => 'Invalid request parameters or user already exists',
          ],
        ],
        'tags' => ['Authentication'],
        'security' => [],
      ],
    ];

    // Password Reset Request endpoint.
    $paths['/api/v1/user/password/reset-request'] = [
      'post' => [
        'summary' => 'Request password reset',
        'description' => 'Request a password reset link to be sent to the email address.',
        'operationId' => 'api_auth.password_reset_request',
        'requestBody' => [
          'required' => TRUE,
          'content' => [
            'application/json' => [
              'schema' => [
                'type' => 'object',
                'required' => ['email'],
                'properties' => [
                  'email' => [
                    'type' => 'string',
                    'format' => 'email',
                    'description' => 'Email address',
                  ],
                ],
              ],
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'Password reset request successful',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      'type' => 'object',
                      'properties' => [
                        'message' => [
                          'type' => 'string',
                          'description' => 'Success message',
                          'example' => 'If the email exists, a password reset link has been sent.',
                        ],
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
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
          '400' => [
            'description' => 'Invalid request parameters',
          ],
          '429' => [
            'description' => 'Too many attempts',
          ],
        ],
        'tags' => ['Authentication'],
        'security' => [],
      ],
    ];

    // Password Reset endpoint.
    $paths['/api/v1/user/password/reset'] = [
      'post' => [
        'summary' => 'Reset password',
        'description' => 'Reset password using a one-time reset link.',
        'operationId' => 'api_auth.password_reset',
        'requestBody' => [
          'required' => TRUE,
          'content' => [
            'application/json' => [
              'schema' => [
                'type' => 'object',
                'required' => ['uid', 'timestamp', 'hash', 'new_password'],
                'properties' => [
                  'uid' => [
                    'type' => 'string',
                    'description' => 'User ID',
                  ],
                  'timestamp' => [
                    'type' => 'string',
                    'description' => 'Timestamp from reset link',
                  ],
                  'hash' => [
                    'type' => 'string',
                    'description' => 'Security hash from reset link',
                  ],
                  'new_password' => [
                    'type' => 'string',
                    'description' => 'New password',
                  ],
                ],
              ],
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'Password reset successful',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      'type' => 'object',
                      'properties' => [
                        'message' => [
                          'type' => 'string',
                          'description' => 'Success message',
                          'example' => 'Password has been reset successfully.',
                        ],
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
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
          '400' => [
            'description' => 'Invalid request parameters',
          ],
          '403' => [
            'description' => 'Invalid or expired reset link',
          ],
        ],
        'tags' => ['Authentication'],
        'security' => [],
      ],
    ];

    // User Profile endpoint.
    $paths['/api/v1/user/profile'] = [
      'get' => [
        'summary' => 'Get user profile',
        'description' => 'Get the authenticated user profile information.',
        'operationId' => 'api_auth.user_profile',
        'responses' => [
          '200' => [
            'description' => 'User profile information',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      'type' => 'object',
                      'properties' => [
                        'email' => [
                          'type' => 'string',
                          'format' => 'email',
                          'description' => 'User email address',
                        ],
                        'name' => [
                          'type' => 'string',
                          'description' => 'Username',
                        ],
                        'roles' => [
                          'type' => 'array',
                          'items' => [
                            'type' => 'string',
                          ],
                          'description' => 'User roles',
                        ],
                        'created' => [
                          'type' => 'string',
                          'format' => 'date-time',
                          'description' => 'Account creation date',
                        ],
                        'last_access' => [
                          'type' => 'string',
                          'format' => 'date-time',
                          'description' => 'Last access date',
                        ],
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
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
          '401' => [
            'description' => 'Unauthorized - No authentication token provided or invalid token',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'message' => [
                      'type' => 'string',
                      'example' => 'Authentication error: Invalid or expired JWT token.',
                    ],
                  ],
                ],
                'example' => [
                  'message' => 'Authentication error: Invalid or expired JWT token.',
                ],
              ],
            ],
          ],
          '404' => [
            'description' => 'User not found',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'message' => [
                      'type' => 'string',
                      'example' => 'User not found.',
                    ],
                  ],
                ],
                'example' => [
                  'message' => 'User not found.',
                ],
              ],
            ],
          ],
        ],
        'tags' => ['User'],
        'security' => [
          ['bearerAuth' => []],
        ],
      ],
    ];

    // User Logout endpoint.
    $paths['/api/v1/user/logout'] = [
      'post' => [
        'summary' => 'Logout',
        'description' => 'Logout the user and revoke their tokens.',
        'operationId' => 'api_auth.user_logout',
        'responses' => [
          '200' => [
            'description' => 'Logout successful',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      'type' => 'object',
                      'properties' => [
                        'message' => [
                          'type' => 'string',
                          'description' => 'Success message',
                          'example' => 'Successfully logged out',
                        ],
                        'removed_tokens' => [
                          'type' => 'integer',
                          'description' => 'Number of tokens removed',
                          'example' => 3,
                        ],
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
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
          '401' => [
            'description' => 'Unauthorized - No authentication token provided or invalid token',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'message' => [
                      'type' => 'string',
                      'example' => 'Authentication error: Invalid or expired JWT token.',
                    ],
                  ],
                ],
                'example' => [
                  'message' => 'Authentication error: Invalid or expired JWT token.',
                ],
              ],
            ],
          ],
        ],
        'tags' => ['Authentication'],
        'security' => [
          ['bearerAuth' => []],
        ],
      ],
    ];

    // OTP Request endpoint.
    $paths['/api/auth/otp/request'] = [
      'post' => [
        'summary' => 'Request OTP',
        'description' => 'Request a one-time password (OTP) to be sent via SMS to the provided phone number.',
        'operationId' => 'api_auth.otp_request',
        'requestBody' => [
          'required' => TRUE,
          'content' => [
            'application/json' => [
              'schema' => [
                'type' => 'object',
                'required' => ['phone_number'],
                'properties' => [
                  'phone_number' => [
                    'type' => 'string',
                    'description' => 'Phone number in international format (e.g., +254712345678)',
                    'example' => '+254712345678',
                  ],
                ],
              ],
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'OTP request successful',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      '$ref' => '#/components/schemas/OtpRequest',
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
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
          '400' => [
            'description' => 'Invalid request parameters',
          ],
          '429' => [
            'description' => 'Too many attempts - rate limit exceeded',
          ],
        ],
        'tags' => ['Authentication'],
        'security' => [],
      ],
    ];

    // OTP Verify endpoint.
    $paths['/api/auth/otp/verify'] = [
      'post' => [
        'summary' => 'Verify OTP',
        'description' => 'Verify the OTP code and authenticate the user. Returns JWT tokens on successful verification.',
        'operationId' => 'api_auth.otp_verify',
        'requestBody' => [
          'required' => TRUE,
          'content' => [
            'application/json' => [
              'schema' => [
                'type' => 'object',
                'required' => ['request_id', 'otp_code'],
                'properties' => [
                  'request_id' => [
                    'type' => 'string',
                    'description' => 'Request ID from the OTP request response',
                    'example' => 'req_abc123def456',
                  ],
                  'otp_code' => [
                    'type' => 'string',
                    'description' => 'The OTP code received via SMS',
                    'example' => '123456',
                  ],
                ],
              ],
            ],
          ],
        ],
        'responses' => [
          '200' => [
            'description' => 'OTP verification successful',
            'content' => [
              'application/json' => [
                'schema' => [
                  'type' => 'object',
                  'properties' => [
                    'data' => [
                      '$ref' => '#/components/schemas/OtpVerifyResponse',
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
                      ],
                    ],
                  ],
                ],
              ],
            ],
          ],
          '400' => [
            'description' => 'Invalid request parameters',
          ],
          '401' => [
            'description' => 'Invalid OTP code or request ID',
          ],
          '429' => [
            'description' => 'Too many attempts - rate limit exceeded',
          ],
        ],
        'tags' => ['Authentication'],
        'security' => [],
      ],
    ];

    return $paths;
  }

}
