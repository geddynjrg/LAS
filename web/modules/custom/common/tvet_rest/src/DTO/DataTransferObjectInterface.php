<?php

namespace Drupal\tvet_rest\DTO;

/**
 * Interface for Data Transfer Objects.
 *
 * Data Transfer Objects (DTOs) are used to transfer data between subsystems
 * and API endpoints. They provide a structured way to validate, transform,
 * and transfer data between the client and server.
 */
interface DataTransferObjectInterface {

  /**
   * Convert the DTO to an array for serialization.
   *
   * @return array
   *   The DTO data as an array.
   */
  public function toArray(): array;

  /**
   * Create a DTO instance from an array of data.
   *
   * @param array $data
   *   The array of data to create the DTO from.
   *
   * @return static
   *   A new instance of the DTO.
   *
   * @throws \InvalidArgumentException
   *   Thrown when the data is invalid.
   */
  public static function fromArray(array $data): self;

  /**
   * Validate the DTO data.
   *
   * @return bool
   *   TRUE if the data is valid, FALSE otherwise.
   */
  public function validate(): bool;

  /**
   * Get validation errors if any.
   *
   * @return array
   *   An array of validation errors.
   */
  public function getValidationErrors(): array;

  /**
   * Get the OpenAPI schema reference name for this DTO.
   *
   * This allows connecting the DTO to the OpenAPI schema system.
   *
   * @return string
   *   The schema reference name.
   */
  public static function getSchemaRef(): string;

}
