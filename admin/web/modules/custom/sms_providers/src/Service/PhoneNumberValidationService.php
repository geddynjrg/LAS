<?php

declare(strict_types=1);

namespace Drupal\sms_providers\Service;

use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\Core\Validation\BasicRecursiveValidatorFactory;
use Drupal\sms_providers\Plugin\Validation\Constraint\PhoneNumberConstraint;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Service for validating phone numbers using Symfony constraints.
 */
class PhoneNumberValidationService implements ContainerInjectionInterface {

  /**
   * The validator factory.
   */
  protected BasicRecursiveValidatorFactory $validatorFactory;

  /**
   * Constructs a PhoneNumberValidationService object.
   *
   * @param \Drupal\Core\Validation\BasicRecursiveValidatorFactory $validator_factory
   *   The validator factory.
   */
  public function __construct(BasicRecursiveValidatorFactory $validator_factory) {
    $this->validatorFactory = $validator_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new static(
      $container->get('validation.basic_recursive_validator_factory')
    );
  }

  /**
   * Checks if a phone number is valid.
   *
   * @param string $phone_number
   *   The phone number to validate.
   *
   * @return bool
   *   TRUE if valid, FALSE otherwise.
   */
  public function isValid(string $phone_number): bool {
    $result = $this->validate($phone_number);

    return $result['valid'];
  }

  /**
   * Normalizes a phone number to E.164 format.
   *
   * @param string $phone_number
   *   The phone number to normalize.
   *
   * @return string
   *   The normalized phone number.
   */
  public function normalize(string $phone_number): string {
    // Remove all non-digit characters.
    $formatted = preg_replace('/[^\d]/', '', $phone_number) ?? '';

    // Handle Kenyan phone number formats and convert to +254XXXXXXXXX.
    if (str_starts_with($formatted, '254')) {
      // Already in correct format: 254XXXXXXXXX -> +254XXXXXXXXX.
      return '+' . $formatted;
    }

    if (str_starts_with($formatted, '0')) {
      // Remove leading 0 and add +254: 0XXXXXXXXX -> +254XXXXXXXXX.
      return '+254' . substr($formatted, 1);
    }

    if (str_starts_with($formatted, '7') && \strlen($formatted) === 9) {
      // Add +254 prefix: 7XXXXXXXX -> +2547XXXXXXXX.
      return '+254' . $formatted;
    }

    // Default case: assume it needs +254 prefix for Kenyan numbers.
    // For international numbers, this logic would need to be extended.
    if (\strlen($formatted) === 9 && str_starts_with($formatted, '1')) {
      // Handle 1XXXXXXXX format -> +2541XXXXXXXX.
      return '+254' . $formatted;
    }

    // If already has country code but no +, add it.
    if (\strlen($formatted) >= 10) {
      return '+' . $formatted;
    }

    // Default fallback: add Kenya country code.
    return '+254' . $formatted;
  }

  /**
   * Validates a phone number.
   *
   * @param string $phone_number
   *   The phone number to validate.
   *
   * @return array
   *   Validation result with 'valid' boolean and 'violations' array.
   */
  public function validate(string $phone_number): array {
    $constraint = new PhoneNumberConstraint();
    $validator = $this->validatorFactory->createValidator();
    $violations = $validator->validate($phone_number, $constraint);

    $result = [
      'valid' => \count($violations) === 0,
      'violations' => [],
    ];

    foreach ($violations as $violation) {
      $result['violations'][] = $violation->getMessage();
    }

    return $result;
  }

}
