<?php

namespace Drupal\rest_framework\DTO\Factory;

use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Drupal\rest_framework\DTO\DataTransferObjectInterface;

/**
 * Factory service for creating and managing DTOs.
 */
class DtoFactory implements DtoFactoryInterface {

  /**
   * The logger service.
   *
   * @var \Drupal\Core\Logger\LoggerChannelInterface
   */
  protected $logger;

  /**
   * Constructs a new DtoFactory.
   *
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $loggerFactory
   *   The logger factory service.
   */
  public function __construct(LoggerChannelFactoryInterface $loggerFactory) {
    $this->logger = $loggerFactory->get('rest_framework');
  }

  /**
   * {@inheritdoc}
   */
  public function createFromArray(string $dtoClass, array $data): ?DataTransferObjectInterface {
    if (!class_exists($dtoClass) || !is_subclass_of($dtoClass, DataTransferObjectInterface::class)) {
      $this->logger->error('Attempted to create DTO with invalid class: @class', ['@class' => $dtoClass]);
      return NULL;
    }

    try {
      /** @var \Drupal\rest_framework\DTO\DataTransferObjectInterface $dto */
      $dto = $dtoClass::fromArray($data);
      // Validate the DTO.
      if (!$dto->validate()) {
        $errors = $dto->getValidationErrors();
        $this->logger->error('DTO validation failed: @errors', ['@errors' => $errors]);
        return NULL;
      }
      return $dto;
    }
    catch (\InvalidArgumentException $e) {
      $this->logger->error('Error creating DTO: @message', ['@message' => $e->getMessage()]);
      return NULL;
    }
    catch (\Exception $e) {
      $this->logger->error('Unexpected error creating DTO: @message', ['@message' => $e->getMessage()]);
      return NULL;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function createFromEntity(string $dtoClass, $entity): ?DataTransferObjectInterface {
    if (!method_exists($dtoClass, 'fromEntity')) {
      $this->logger->error('DTO class does not support fromEntity: @class', ['@class' => $dtoClass]);
      return NULL;
    }

    try {
      /** @var \Drupal\rest_framework\DTO\DataTransferObjectInterface $dto */
      $dto = $dtoClass::fromEntity($entity);
      // Validate the DTO.
      if (!$dto->validate()) {
        $errors = $dto->getValidationErrors();
        $this->logger->error('DTO validation failed (fromEntity): @errors', ['@errors' => $errors]);
        return NULL;
      }
      return $dto;
    }
    catch (\Exception $e) {
      $this->logger->error('Error creating DTO from entity: @message', ['@message' => $e->getMessage()]);
      return NULL;
    }
  }

  /**
   * {@inheritdoc}
   */
  public function validate(DataTransferObjectInterface $dto): bool {
    return $dto->validate();
  }

}
