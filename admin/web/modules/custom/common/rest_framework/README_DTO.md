# TVET REST DTO System

## Overview

The Data Transfer Object (DTO) system provides a structured way to handle data transfer between the API and clients. It includes:

- A common interface and base class for DTOs
- Validation using Symfony's Validator component
- Integration with OpenAPI schema documentation
- Automatic schema generation based on PHP type hints and annotations
- A factory service for creating DTOs from arrays or entities

## Components

### Core DTO Classes

- `DataTransferObjectInterface`: The core interface that all DTOs must implement
- `DataTransferObject`: Abstract base class with common functionality
- `SchemaReferenceTrait`: Trait for connecting DTOs to OpenAPI schemas

### Factory

- `DtoFactoryInterface`: Interface for DTO factory
- `DtoFactory`: Service for creating DTOs from arrays or entities

### Schema Generation

- `DtoSchemaProviderBase`: Base class for OpenAPI schema providers that work with DTOs

## How to Use

### 1. Create a DTO Class

```php
<?php

namespace Drupal\my_module\DTO;

use Drupal\rest_framework\DTO\DataTransferObject;
use Drupal\rest_framework\DTO\SchemaReferenceTrait;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * DTO for MyEntity.
 */
class MyEntityDto extends DataTransferObject {
  
  use SchemaReferenceTrait;
  
  /**
   * The entity ID.
   *
   * @Assert\Type("integer")
   * @var int|null
   */
  protected ?int $id = null;
  
  /**
   * The entity title.
   *
   * @Assert\NotBlank
   * @Assert\Type("string")
   * @var string
   */
  protected string $title;
  
  // Add getters, setters, and required methods...
  
  /**
   * {@inheritdoc}
   */
  public function toArray(): array {
    return [
      'id' => $this->id,
      'title' => $this->title,
    ];
  }
  
  /**
   * {@inheritdoc}
   */
  public static function fromArray(array $data): self {
    $dto = new static();
    
    if (isset($data['id'])) {
      $dto->id = $dto->convertValue($data['id'], 'int');
    }
    
    $dto->title = $dto->convertValue($data['title'] ?? '', 'string');
    
    return $dto;
  }
  
  /**
   * Create from entity.
   *
   * @param \Drupal\my_module\Entity\MyEntityInterface $entity
   *   The entity.
   *
   * @return self
   *   The DTO.
   */
  public static function fromEntity(MyEntityInterface $entity): self {
    $dto = new static();
    $dto->id = $entity->id();
    $dto->title = $entity->label();
    return $dto;
  }
  
  /**
   * {@inheritdoc}
   */
  public static function getSchemaRef(): string {
    return static::getSchemaRefByName('MyEntity');
  }
}
```

### 2. Create a Schema Provider

```php
<?php

namespace Drupal\my_module\Plugin\OpenApiSchemaProvider;

use Drupal\my_module\DTO\MyEntityDto;
use Drupal\rest_framework\Plugin\DtoSchemaProviderBase;

/**
 * Provides OpenAPI schema definitions for MyEntity DTO.
 *
 * @OpenApiSchemaProvider(
 *   id = "my_entity_dto",
 *   label = @Translation("MyEntity DTO Schema Provider"),
 *   priority = 10
 * )
 */
class MyEntityDtoSchemaProvider extends DtoSchemaProviderBase {

  /**
   * {@inheritdoc}
   */
  protected function getDtoClasses(): array {
    return [
      MyEntityDto::class,
    ];
  }
  
  /**
   * {@inheritdoc}
   */
  public function getComponentDefinitions(): array {
    $components = [];
    
    // Generate schemas for all DTO classes.
    foreach ($this->getDtoClasses() as $dtoClass) {
      $schemaName = $this->getDtoSchemaName($dtoClass);
      $components[$schemaName] = $this->generateSchemaForDto($dtoClass, $schemaName);
    }
    
    return $components;
  }
  
  /**
   * {@inheritdoc}
   */
  public function getPathDefinitions(): array {
    // Define API endpoints...
    return $paths;
  }
  
  /**
   * Get a schema name for a DTO class.
   */
  protected function getDtoSchemaName(string $dtoClass): string {
    $parts = explode('\\', $dtoClass);
    $className = end($parts);
    return str_replace('Dto', '', $className);
  }
}
```

### 3. Use the DTO Factory in Controllers

```php
<?php

namespace Drupal\my_module\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\my_module\DTO\MyEntityDto;
use Drupal\rest_framework\DTO\Factory\DtoFactoryInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Controller for MyEntity API endpoints.
 */
class MyEntityApiController extends ControllerBase {

  /**
   * The DTO factory.
   *
   * @var \Drupal\rest_framework\DTO\Factory\DtoFactoryInterface
   */
  protected $dtoFactory;
  
  /**
   * Constructor.
   */
  public function __construct(DtoFactoryInterface $dto_factory) {
    $this->dtoFactory = $dto_factory;
  }
  
  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('rest_framework.dto_factory')
    );
  }
  
  /**
   * Get an entity.
   */
  public function getEntity(Request $request, $id): JsonResponse {
    $entity = $this->entityTypeManager()->getStorage('my_entity')->load($id);
    
    if (!$entity) {
      return new JsonResponse(['error' => 'Entity not found'], 404);
    }
    
    // Create DTO from entity
    $dto = $this->dtoFactory->createFromEntity(MyEntityDto::class, $entity);
    
    if (!$dto) {
      return new JsonResponse(['error' => 'Error creating DTO'], 500);
    }
    
    return new JsonResponse($dto->toArray());
  }
  
  /**
   * Create an entity.
   */
  public function createEntity(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);
    
    // Create DTO from request data
    $dto = $this->dtoFactory->createFromArray(MyEntityDto::class, $data);
    
    if (!$dto) {
      return new JsonResponse(['error' => 'Invalid data provided'], 400);
    }
    
    // Use the DTO to create an entity
    // ...
    
    return new JsonResponse($dto->toArray(), 201);
  }
}
```

## Benefits

- **Consistent Data Structure**: DTOs provide a consistent structure for data exchange
- **Validation**: Automatic validation of incoming data
- **Schema Documentation**: OpenAPI schema generation based on DTO definitions
- **Type Safety**: Type hints in PHP ensure data integrity
- **Separation of Concerns**: Separates data transfer logic from entity logic

## Adding Validation Rules

DTOs use Symfony's Validator component. You can add constraints using annotations:

```php
/**
 * The entity title.
 *
 * @Assert\NotBlank
 * @Assert\Length(min=3, max=100)
 * @var string
 */
protected string $title;
```

## Connecting DTOs to Schemas

The `SchemaReferenceTrait` provides a connection between DTOs and OpenAPI schemas. By default, it uses the class name (minus "Dto") as the schema name, but you can override this:

```php
/**
 * {@inheritdoc}
 */
public static function getSchemaRef(): string {
  return static::getSchemaRefByName('CustomSchemaName');
}
```

## Converting Between Formats

DTOs include methods for converting between arrays and objects:

- `toArray()`: Convert a DTO to an array
- `fromArray()`: Create a DTO from an array
- `fromEntity()`: Create a DTO from an entity (custom implementation) 