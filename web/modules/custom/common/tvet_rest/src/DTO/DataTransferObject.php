<?php

namespace Drupal\tvet_rest\DTO;

use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Abstract base class for Data Transfer Objects.
 *
 * This class provides common functionality for all DTOs in the system,
 * including validation, serialization, and schema reference handling.
 */
abstract class DataTransferObject implements DataTransferObjectInterface {

  /**
   * Validation errors.
   *
   * @var array
   */
  protected array $validationErrors = [];

  /**
   * The validator service.
   *
   * @var \Symfony\Component\Validator\Validator\ValidatorInterface|null
   */
  protected static ?ValidatorInterface $validator = NULL;

  /**
   * {@inheritdoc}
   */
  public function validate(): bool {
    $this->validationErrors = [];

    // Initialize validator if not already done.
    if (static::$validator === NULL) {
      static::$validator = Validation::createValidator();
    }

    // Perform validation using Symfony validator component.
    $violations = static::$validator->validate($this);

    if (count($violations) > 0) {
      foreach ($violations as $violation) {
        $this->validationErrors[$violation->getPropertyPath()] = $violation->getMessage();
      }
      return FALSE;
    }

    return TRUE;
  }

  /**
   * {@inheritdoc}
   */
  public function getValidationErrors(): array {
    return $this->validationErrors;
  }

  /**
   * Helper method to convert a value to its expected type.
   *
   * @param mixed $value
   *   The value to convert.
   * @param string $type
   *   The expected type.
   *
   * @return mixed
   *   The converted value.
   */
  protected function convertValue($value, string $type) {
    if ($value === NULL) {
      return NULL;
    }

    switch ($type) {
      case 'int':
      case 'integer':
        return (int) $value;

      case 'float':
      case 'double':
        return (float) $value;

      case 'bool':
      case 'boolean':
        return (bool) $value;

      case 'string':
        return (string) $value;

      case 'array':
        return (array) $value;

      case 'datetime':
        if (is_numeric($value)) {
          return new \DateTime('@' . $value);
        }
        elseif (is_string($value)) {
          return new \DateTime($value);
        }
        return $value;

      default:
        return $value;
    }
  }

  /**
   * Recursively convert DTO objects in an array to arrays.
   *
   * @param array $data
   *   The array possibly containing DTO objects.
   *
   * @return array
   *   The converted array.
   */
  protected function convertDtosToArrays(array $data): array {
    foreach ($data as $key => $value) {
      if ($value instanceof DataTransferObjectInterface) {
        $data[$key] = $value->toArray();
      }
      elseif (is_array($value)) {
        $data[$key] = $this->convertDtosToArrays($value);
      }
      elseif ($value instanceof \DateTime) {
        $data[$key] = $value->format('c');
      }
    }
    return $data;
  }

}
