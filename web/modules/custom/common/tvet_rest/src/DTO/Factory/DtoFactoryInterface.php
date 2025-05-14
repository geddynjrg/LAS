<?php

namespace Drupal\tvet_rest\DTO\Factory;

use Drupal\tvet_rest\DTO\DataTransferObjectInterface;

/**
 * Interface for DTO factory service.
 */
interface DtoFactoryInterface {

  /**
   * Create a DTO from array data.
   *
   * @param string $dtoClass
   *   The fully-qualified class name of the DTO to create.
   * @param array $data
   *   The data to create the DTO from.
   *
   * @return \Drupal\tvet_rest\DTO\DataTransferObjectInterface|null
   *   The created DTO, or NULL if creation failed.
   */
  public function createFromArray(string $dtoClass, array $data): ?DataTransferObjectInterface;

  /**
   * Create a DTO from a Drupal entity.
   *
   * @param string $dtoClass
   *   The fully-qualified class name of the DTO to create.
   * @param object $entity
   *   The entity to create the DTO from.
   *
   * @return \Drupal\tvet_rest\DTO\DataTransferObjectInterface|null
   *   The created DTO, or NULL if creation failed.
   */
  public function createFromEntity(string $dtoClass, $entity): ?DataTransferObjectInterface;

  /**
   * Validate a DTO.
   *
   * @param \Drupal\tvet_rest\DTO\DataTransferObjectInterface $dto
   *   The DTO to validate.
   *
   * @return bool
   *   TRUE if the DTO is valid, FALSE otherwise.
   */
  public function validate(DataTransferObjectInterface $dto): bool;

}
