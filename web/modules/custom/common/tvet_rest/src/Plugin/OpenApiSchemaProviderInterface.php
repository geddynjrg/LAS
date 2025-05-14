<?php

namespace Drupal\tvet_rest\Plugin;

/**
 * Interface for OpenAPI Schema Provider plugins.
 */
interface OpenApiSchemaProviderInterface {

  /**
   * Gets the schema definitions to add to the OpenAPI documentation.
   *
   * @return array
   *   An array of OpenAPI path items indexed by path.
   */
  public function getPathDefinitions(): array;

  /**
   * Gets the schema component definitions to add to the OpenAPI documentation.
   *
   * @return array
   *   An array of OpenAPI schema component definitions indexed by name.
   */
  public function getComponentDefinitions(): array;

  /**
   * Gets the priority of this schema provider.
   *
   * Higher numbers mean the provider will be processed later.
   * This allows for overriding schemas.
   *
   * @return int
   *   The priority of this schema provider.
   */
  public function getPriority(): int;

  /**
   * Generates example responses for specific path and method combinations.
   *
   * @param string $path
   *   The path for which to generate an example.
   * @param string $method
   *   The HTTP method (get, post, etc.) for which to generate an example.
   *
   * @return array|null
   *   An array containing the example data, or NULL if no example is available.
   */
  public function generateExample(string $path, string $method): ?array;

}
