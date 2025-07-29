# OpenAPI Schema Providers

This directory contains OpenAPI schema provider plugins for the REST Framework module.

## Overview

OpenAPI Schema Providers are plugins that define API documentation schemas, endpoints, and examples for your REST API. They extend the `OpenApiSchemaProviderBase` class and implement the `OpenApiSchemaProviderInterface`.

## Creating a Schema Provider

### 1. Basic Structure

Create a new PHP class in this directory that extends `OpenApiSchemaProviderBase`:

```php
<?php

namespace Drupal\rest_framework\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema definitions for your endpoints.
 *
 * @OpenApiSchemaProvider(
 *   id = "your_provider_id",
 *   label = @Translation("Your Provider Label"),
 *   priority = 0
 * )
 */
class YourSchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    // Define your API endpoints here
    return [];
  }

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    // Define reusable schema components here
    return [];
  }

  /**
   * {@inheritdoc}
   */
  public function generateExample(string $path, string $method): ?array {
    // Generate example responses for your endpoints
    return NULL;
  }

}
```

### 2. Plugin Annotation

The `@OpenApiSchemaProvider` annotation defines:
- `id`: Unique identifier for your provider
- `label`: Human-readable label
- `priority`: Loading priority (higher numbers load first)

### 3. Required Methods

#### `getPathDefinitions()`
Define your API endpoints with full OpenAPI specification:

```php
public function getPathDefinitions(): array {
  $paths = [];

  $paths['/api/v1/your-endpoint/{id}'] = [
    'get' => [
      'summary' => 'Get item by ID',
      'description' => 'Retrieves a specific item by its ID.',
      'operationId' => 'rest_framework.your_endpoint_get',
      'parameters' => [
        [
          'name' => 'id',
          'in' => 'path',
          'required' => TRUE,
          'schema' => ['type' => 'string'],
          'description' => 'The item ID',
        ],
      ],
      'responses' => [
        '200' => [
          'description' => 'Item retrieved successfully',
          'content' => [
            'application/json' => [
              'schema' => [
                'type' => 'object',
                'properties' => [
                  'data' => ['$ref' => '#/components/schemas/YourSchema'],
                  'meta' => ['$ref' => '#/components/schemas/ApiMeta'],
                ],
              ],
            ],
          ],
        ],
        '404' => ['description' => 'Item not found'],
      ],
      'tags' => ['Your Tag'],
      'security' => [], // Empty for public endpoints
    ],
  ];

  return $paths;
}
```

#### `getComponentDefinitions()`
Define reusable schema components:

```php
public function getComponentDefinitions(): array {
  $components = [];

  $components['YourSchema'] = [
    'type' => 'object',
    'properties' => [
      'id' => [
        'type' => 'string',
        'description' => 'The item ID',
        'example' => '1',
      ],
      'title' => [
        'type' => 'string',
        'description' => 'The item title',
        'example' => 'Example Title',
      ],
      'content' => [
        'type' => 'object',
        'properties' => [
          'body' => ['$ref' => '#/components/schemas/TextWithFormat'],
        ],
      ],
    ],
    'required' => ['id', 'title'],
  ];

  $components['TextWithFormat'] = [
    'type' => 'object',
    'properties' => [
      'value' => [
        'type' => 'string',
        'description' => 'The raw text value',
        'example' => '<p>Example content</p>',
      ],
      'format' => [
        'type' => 'string',
        'description' => 'The text format',
        'example' => 'full_html',
      ],
      'processed' => [
        'type' => 'string',
        'description' => 'The processed/rendered text',
        'example' => '<p>Example content</p>',
      ],
    ],
    'required' => ['value', 'format', 'processed'],
  ];

  return $components;
}
```

#### `generateExample()`
Generate realistic example responses:

```php
public function generateExample(string $path, string $method): ?array {
  // Only generate examples for paths this provider handles
  if (!isset($this->getPathDefinitions()[$path][$method])) {
    return NULL;
  }

  if ($path === '/api/v1/your-endpoint/{id}' && $method === 'get') {
    return [
      'data' => [
        'id' => '1',
        'title' => 'Example Item',
        'content' => [
          'body' => [
            'value' => '<p>This is example content.</p>',
            'format' => 'full_html',
            'processed' => '<p>This is example content.</p>',
          ],
        ],
      ],
      'meta' => [
        'timestamp' => time(),
        'version' => 'v1',
        'language' => [
          'current' => 'en',
          'default' => 'en',
        ],
      ],
    ];
  }

  return NULL;
}
```

## Best Practices

### 1. Naming Conventions
- Use descriptive provider IDs: `content_endpoints`, `user_endpoints`, etc.
- Use consistent operation IDs: `rest_framework.{resource}_{action}`
- Use clear schema component names: `NodeLanding`, `TextWithFormat`, etc.

### 2. Schema Organization
- Group related endpoints in the same provider
- Create reusable components for common structures
- Use `$ref` to reference components and avoid duplication

### 3. Documentation Quality
- Provide clear descriptions for all endpoints and parameters
- Include realistic examples that match your actual API responses
- Use appropriate HTTP status codes and error responses

### 4. Security
- Define security requirements for protected endpoints
- Use empty `security: []` for public endpoints
- Document authentication requirements clearly

### 5. Versioning
- Include API version in paths: `/api/v1/...`
- Use consistent versioning across all endpoints
- Document version information in meta responses

## Example Implementation

For a complete example, see the `ContentEndpointsProvider` in the `api_content` module:
- Location: `web/modules/custom/api_content/src/Plugin/OpenApiSchemaProvider/ContentEndpointsProvider.php`
- Demonstrates node endpoints with complex nested structures
- Shows proper use of paragraph mappers and field mapping
- Includes comprehensive examples and schema definitions

## Integration with Paragraph Mappers

When working with Drupal paragraphs, your schema provider should:

1. Reference paragraph mapper schemas in component definitions
2. Use the same structure as your paragraph mappers' `getOpenApiExample()` methods
3. Ensure consistency between actual API responses and documentation

## Testing Your Provider

1. Clear Drupal caches after creating/modifying providers
2. Visit `/api/docs` to see your OpenAPI documentation
3. Verify that examples match actual API responses
4. Test all defined endpoints to ensure they work as documented

## Common Issues

- **Provider not loading**: Check annotation syntax and clear caches
- **Schema validation errors**: Ensure all required properties are defined
- **Examples don't match responses**: Update examples to match actual API output
- **Missing components**: Make sure all `$ref` references point to defined components
