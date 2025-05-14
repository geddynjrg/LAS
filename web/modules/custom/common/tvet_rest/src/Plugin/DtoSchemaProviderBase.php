<?php

namespace Drupal\tvet_rest\Plugin;

use Drupal\tvet_rest\DTO\DataTransferObjectInterface;

/**
 * Base class for OpenAPI Schema Provider plugins that use DTOs.
 *
 * This extends the standard OpenApiSchemaProviderBase with functionality
 * specifically for working with DTOs.
 */
abstract class DtoSchemaProviderBase extends OpenApiSchemaProviderBase {

  /**
   * Get all DTO classes used by this schema provider.
   *
   * @return array
   *   An array of DTO class names.
   */
  abstract protected function getDtoClasses(): array;

  /**
   * Get reflection properties for a DTO class.
   *
   * @param string $dtoClass
   *   The DTO class name.
   *
   * @return \ReflectionProperty[]
   *   An array of reflection properties.
   */
  protected function getReflectionProperties(string $dtoClass): array {
    $reflection = new \ReflectionClass($dtoClass);
    return $reflection->getProperties(\ReflectionProperty::IS_PROTECTED);
  }

  /**
   * Get an OpenAPI schema type from a PHP type.
   *
   * @param string $phpType
   *   The PHP type.
   *
   * @return array
   *   The OpenAPI schema type definition.
   */
  protected function getSchemaTypeFromPhpType(string $phpType): array {
    $schema = [];

    // Handle nullable types.
    $isNullable = FALSE;
    if (strpos($phpType, '?') === 0) {
      $isNullable = TRUE;
      $phpType = substr($phpType, 1);
    }

    // Map PHP types to OpenAPI types.
    switch ($phpType) {
      case 'int':
      case 'integer':
        $schema['type'] = 'integer';
        break;

      case 'float':
      case 'double':
        $schema['type'] = 'number';
        break;

      case 'bool':
      case 'boolean':
        $schema['type'] = 'boolean';
        break;

      case 'string':
        $schema['type'] = 'string';
        break;

      case 'array':
        $schema['type'] = 'array';
        // Default items if not provided.
        $schema['items'] = ['type' => 'string'];
        break;

      case '\DateTime':
        $schema['type'] = 'string';
        $schema['format'] = 'date-time';
        break;

      default:
        // Check if this is a DTO class.
        if (class_exists($phpType) && is_subclass_of($phpType, DataTransferObjectInterface::class)) {
          $schema['$ref'] = $phpType::getSchemaRef();
        }
        else {
          // Default to string for unknown types.
          $schema['type'] = 'string';
        }
    }

    // Handle nullable types in OpenAPI 3.0.
    if ($isNullable) {
      $schema['nullable'] = TRUE;
    }

    return $schema;
  }

  /**
   * Generate an OpenAPI schema for a DTO class.
   *
   * @param string $dtoClass
   *   The DTO class name.
   * @param string $schemaName
   *   The schema name.
   *
   * @return array
   *   The OpenAPI schema.
   */
  protected function generateSchemaForDto(string $dtoClass, string $schemaName): array {
    $schema = [
      'type' => 'object',
      'title' => $schemaName,
      'description' => "Schema for {$schemaName}",
      'properties' => [],
      'required' => [],
    ];

    $properties = $this->getReflectionProperties($dtoClass);

    foreach ($properties as $property) {
      $propertyName = $property->getName();

      // Skip internal properties.
      if ($propertyName === 'validationErrors') {
        continue;
      }

      // Convert camelCase to snake_case for property names.
      $jsonName = $this->camelToSnake($propertyName);

      // Get property type.
      $type = $this->getPropertyType($property);

      // Get property schema.
      $propertySchema = $this->getSchemaTypeFromPhpType($type);

      // Add description from property docblock.
      $docComment = $property->getDocComment();
      if ($docComment) {
        $description = $this->extractDescriptionFromDocComment($docComment);
        if ($description) {
          $propertySchema['description'] = $description;
        }
      }

      // Check for required validation rule.
      if ($this->isPropertyRequired($property)) {
        $schema['required'][] = $jsonName;
      }

      // Check for enum/choice values.
      $choices = $this->extractChoicesFromDocComment($docComment);
      if (!empty($choices)) {
        $propertySchema['enum'] = $choices;
      }

      // Add to properties.
      $schema['properties'][$jsonName] = $propertySchema;
    }

    return $schema;
  }

  /**
   * Convert a camelCase string to snake_case.
   *
   * @param string $input
   *   The camelCase string.
   *
   * @return string
   *   The snake_case string.
   */
  protected function camelToSnake(string $input): string {
    return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $input));
  }

  /**
   * Extract a property type from a reflection property.
   *
   * @param \ReflectionProperty $property
   *   The reflection property.
   *
   * @return string
   *   The property type.
   */
  protected function getPropertyType(\ReflectionProperty $property): string {
    // First try to get the type from PHP 7.4+ type hints.
    if ($property->hasType()) {
      $type = $property->getType();
      return ($type->allowsNull() ? '?' : '') . $type->getName();
    }

    // If no type hint, fallback to extracting from docblock.
    $docComment = $property->getDocComment();
    if ($docComment) {
      if (preg_match('/@var\s+([^\s]+)/', $docComment, $matches)) {
        return $matches[1];
      }
    }

    // Default to string if no type can be determined.
    return 'string';
  }

  /**
   * Extract the description from a doc comment.
   *
   * @param string $docComment
   *   The doc comment.
   *
   * @return string|null
   *   The description, or NULL if none found.
   */
  protected function extractDescriptionFromDocComment(string $docComment): ?string {
    // Remove the /** and */ from the doc comment.
    $docComment = preg_replace('/^\s*\/\*\*|\*\/\s*$/s', '', $docComment);

    // Remove * from the beginning of each line.
    $docComment = preg_replace('/^\s*\*\s*/m', '', $docComment);

    // Extract the description (everything before the first @tag).
    if (preg_match('/^([^@]*?)(?:@|$)/s', $docComment, $matches)) {
      $description = trim($matches[1]);
      return $description ?: NULL;
    }

    return NULL;
  }

  /**
   * Determine if a property is required based on its doc comment.
   *
   * @param \ReflectionProperty $property
   *   The reflection property.
   *
   * @return bool
   *   TRUE if the property is required, FALSE otherwise.
   */
  protected function isPropertyRequired(\ReflectionProperty $property): bool {
    $docComment = $property->getDocComment();
    if ($docComment) {
      if (preg_match('/@Assert\\\\NotBlank|@Assert\\\\NotNull/', $docComment)) {
        return TRUE;
      }
    }
    return FALSE;
  }

  /**
   * Extract enum/choice values from a doc comment.
   *
   * @param string $docComment
   *   The doc comment.
   *
   * @return array
   *   An array of enum/choice values.
   */
  protected function extractChoicesFromDocComment(string $docComment): array {
    $choices = [];
    if (preg_match('/@Assert\\\\Choice\(([^)]+)\)/', $docComment, $matches)) {
      $choiceStr = $matches[1];
      if (preg_match_all('/"([^"]+)"/', $choiceStr, $choiceMatches)) {
        $choices = $choiceMatches[1];
      }
    }
    return $choices;
  }

  /**
   * Get a schema name for a DTO class.
   *
   * @param string $dtoClass
   *   The DTO class name.
   *
   * @return string
   *   The schema name.
   */
  protected function getDtoSchemaName(string $dtoClass): string {
    $parts = explode('\\', $dtoClass);
    $className = end($parts);
    return str_replace('Dto', '', $className);
  }

}
