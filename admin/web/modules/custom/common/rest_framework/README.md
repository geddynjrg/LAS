# UWEZO REST API Module

This module provides REST API endpoints for accessing UWEZO content with multilingual support, path resolution capabilities, and JWT authentication.

## Endpoints

### Content Endpoints

### 1. Content by Node ID

```http
GET /api/v1/node/{id}
```

Retrieve content by its node ID or path alias.

#### Parameters
- `id` (path parameter): Node ID or path alias
- `lang` (query parameter, optional): Language code
- `X-Language` (header, optional): Preferred language

#### Example Requests
```http
# By Node ID
GET /api/v1/node/123

# With language
GET /api/v1/node/123?lang=fr
```

### 2. Content by Path Resolution

```http
GET /api/v1/resolve
```

Resolve and retrieve content by its path alias.

#### Headers
- `X-Path` (required): The path to resolve (e.g., "/about-us")
- `X-Language` (optional): Preferred language code

#### Query Parameters
- `path` (alternative to X-Path): The path to resolve
- `lang` (optional): Language code

#### Example Requests
```http
# Using header (recommended)
GET /api/v1/resolve
X-Path: /about-us
X-Language: fr

# Using query parameters
GET /api/v1/resolve?path=/about-us&lang=fr
```

### 3. Course Listing and Search

```http
GET /api/v1/courses
```

Returns a paginated and filterable list of courses.

#### Query Parameters
```
search          string    Search in title and body
min_fee         integer   Minimum course fee (KSh)
max_fee         integer   Maximum course fee (KSh)
min_duration    integer   Minimum duration in months
max_duration    integer   Maximum duration in months
education_level integer   Required education level ID
institution     integer   Institution ID to filter by
tag             integer   Tag ID to filter by
page            integer   Page number (0-based, default: 0)
limit           integer   Items per page (1-50, default: 12)
sort            string    Sort field (created, title)
direction       string    Sort direction (ASC, DESC)
lang            string    Language code (optional)
```

#### Example Requests
```http
# Search courses
GET /api/v1/courses?search=electrical

# Filter by fee range
GET /api/v1/courses?min_fee=1000&max_fee=5000

# Filter by institution and education level
GET /api/v1/courses?institution=123&education_level=none

# Paginated and sorted results
GET /api/v1/courses?page=1&limit=20&sort=title&direction=ASC

# With language
GET /api/v1/courses?lang=sw
```

#### Response Format
```json
{
  "data": {
    "type": "course_list",
    "courses": [
      {
        "id": 123,
        "title": "Course Title",
        "tags": [
          {
            "id": 1,
            "name": "Tag Name"
          }
        ],
        "application_fee": "1000",
        "course_fee": "5000",
        "apply_till": "2024-12-31",
        "start_on": "2024-01-01",
        "institution": {
          "id": 456,
          "title": "Institution Name",
          "url": "/institution/name"
        },
        "url": "/node/123",
        "path_alias": "/course/course-title"
      }
    ]
  },
  "meta": {
    "timestamp": 1234567890,
    "version": "v1",
    "pagination": {
      "total": 200,
      "page": 0,
      "limit": 12,
      "pages": 17
    },
    "filters": {
      "search": "electrical",
      "min_fee": 1000,
      "max_fee": 5000,
      "min_duration": null,
      "max_duration": null,
      "education_level": null,
      "institution": null
    },
    "sort": {
      "field": "created",
      "direction": "DESC"
    },
    "language": {
      "current": "en",
      "default": "en",
      "available": {
        "en": {
          "langcode": "en",
          "name": "English",
          "direction": "ltr"
        },
        "sw": {
          "langcode": "sw",
          "name": "Swahili",
          "direction": "ltr"
        }
      }
    }
  }
}
```

## Error Responses

The API returns appropriate HTTP status codes and error messages:

```json
{
  "message": "Error message here",
  "status": 404
}
```

Common error codes:
- `400 Bad Request`: Missing or invalid parameters
- `404 Not Found`: Content or path not found
- `415 Unsupported Media Type`: Invalid content type
- `500 Internal Server Error`: Server-side error

## CORS Support

The API supports Cross-Origin Resource Sharing (CORS) with the following headers:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Language, X-Path
```

## Language Support

The API supports multilingual content through:
1. `X-Language` header (preferred)
2. `lang` query parameter
3. Falls back to site's default language

Each response includes detailed language metadata:
```json
{
  "language": {
    "current": "en",
    "default": "en",
    "available": {
      "en": {
        "langcode": "en",
        "name": "English",
        "direction": "ltr"
      }
    }
  }
}
```

## Cache Support

The API implements Drupal's cache system with:
- Entity-based cache dependencies
- Language-aware caching
- Path alias cache tags

## Installation

1. Install the module:
   ```bash
   composer require drupal/rest_framework
   drush en rest_framework
   ```

2. Configure permissions:
   - Go to Admin > People > Permissions
   - Grant "Access UWEZO REST API" permission to appropriate roles

## Development

### OpenAPI Schema Provider System

The module provides an extensible OpenAPI schema generation system through plugins that allows other modules to contribute endpoint definitions to the API documentation.

#### Creating a Schema Provider Plugin

1. Create a class that extends `\Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase` and implements the required methods:

```php
namespace Drupal\my_module\Plugin\OpenApiSchemaProvider;

use Drupal\rest_framework\Plugin\OpenApiSchemaProviderBase;

/**
 * Provides OpenAPI schema definitions for my_module.
 *
 * @OpenApiSchemaProvider(
 *   id = "my_schema_provider",
 *   label = @Translation("My Schema Provider"),
 *   priority = 0
 * )
 */
class MySchemaProvider extends OpenApiSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    $paths = [];
    
    // Define your API endpoints here.
    $paths['/api/v1/my-endpoint'] = [
      'get' => [
        'summary' => 'My endpoint',
        'description' => 'Description of my endpoint',
        // ... other OpenAPI properties
      ],
    ];
    
    return $paths;
  }

  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    $components = [];
    
    // Define component schemas specific to your endpoints.
    $components['MySchema'] = [
      'type' => 'object',
      'properties' => [
        // ... schema properties
      ],
    ];
    
    return $components;
  }
  
  /**
   * {@inheritdoc}
   */
  public function generateExample(string $path, string $method): ?array {
    // Only handle examples for paths defined by this provider
    if (!isset($this->getPathDefinitions()[$path][$method])) {
      return NULL;
    }
    
    if ($path === '/api/v1/my-endpoint' && $method === 'get') {
      // Return an example response for the endpoint
      return [
        'data' => [
          // Example data that matches your schema
        ],
        'meta' => [
          'timestamp' => time(),
          'version' => 'v1',
        ],
      ];
    }
    
    return NULL;
  }
}
```

2. The plugin will automatically be discovered and used when generating the OpenAPI documentation.

3. To organize your endpoints logically, you can create multiple plugins with different priorities:
   - Higher priority values will be processed later, allowing for overriding schemas.
   - Group related endpoints in the same plugin for better maintainability.
   - Consider creating separate plugins for different functional areas (e.g., authentication, content, etc.).

### Adding New Paragraph Types

Create a new mapper class in `src/Plugin/ParagraphMapper`:

```php
/**
 * @ParagraphMapper(
 *   id = "example",
 *   label = @Translation("Example Mapper"),
 *   paragraph_type = "example"
 * )
 */
class ExampleMapper extends ParagraphMapperBase {
  public function map(ParagraphInterface $paragraph): array {
    return [
      'type' => 'example',
      // ... mapped fields
    ];
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the GPL v2.0 or later.
