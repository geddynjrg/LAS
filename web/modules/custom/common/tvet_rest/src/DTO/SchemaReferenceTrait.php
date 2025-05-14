<?php

namespace Drupal\tvet_rest\DTO;

/**
 * Trait for connecting DTOs to OpenAPI schema references.
 *
 * This trait provides functionality to connect DTOs to their corresponding
 * OpenAPI schema references, making it easier to maintain the connection
 * between DTOs and schemas.
 */
trait SchemaReferenceTrait {

  /**
   * Get the schema reference format for a schema name.
   *
   * @param string $name
   *   The schema name.
   *
   * @return string
   *   The full schema reference.
   */
  public static function getSchemaRefByName(string $name): string {
    return '#/components/schemas/' . $name;
  }

  /**
   * Get a PHP class name without namespace.
   *
   * @param string $class
   *   The full class name.
   *
   * @return string
   *   The class name without namespace.
   */
  protected static function getShortClassName(string $class): string {
    $parts = explode('\\', $class);
    return end($parts);
  }

  /**
   * {@inheritdoc}
   */
  public static function getSchemaRef(): string {
    // By default, use the short class name as the schema reference.
    // Child classes can override this method to provide custom schema
    // references.
    $className = static::getShortClassName(static::class);
    return static::getSchemaRefByName($className);
  }

}
