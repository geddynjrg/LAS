<?php

declare(strict_types=1);

namespace Drupal\sms_providers\Plugin\Validation\Constraint;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;

/**
 * Validates that a value is a valid phone number in E.164 format.
 */
class PhoneNumberConstraintValidator extends ConstraintValidator {

  /**
   * {@inheritdoc}
   */
  public function validate(mixed $value, Constraint $constraint): void {
    \assert($constraint instanceof PhoneNumberConstraint);

    // Allow null/empty values - use a separate Required constraint if needed.
    if ($value === NULL || $value === '') {
      return;
    }

    if (!\is_string($value)) {
      $this->context->addViolation($constraint->message, ['@value' => (string) $value]);

      return;
    }

    // Always normalize the phone number.
    $value = $this->normalizePhoneNumber($value);

    // Validate the normalized phone number.
    if (!$this->isValidPhoneNumber($value, $constraint->minDigits, $constraint->maxDigits)) {
      $this->context->addViolation($constraint->message, ['@value' => $value]);
    }
  }

  /**
   * Validates a phone number format.
   *
   * @param string $phone
   *   The phone number to validate.
   * @param int $min_digits
   *   Minimum number of digits.
   * @param int $max_digits
   *   Maximum number of digits.
   *
   * @return bool
   *   TRUE if valid, FALSE otherwise.
   */
  protected function isValidPhoneNumber(string $phone, int $min_digits, int $max_digits): bool {
    // Basic E.164 validation: + followed by 1-3 digit country code,
    // then local number.
    $pattern = \sprintf('/^\+[1-9]\d{%d,%d}$/', $min_digits - 1, $max_digits - 1);

    return preg_match($pattern, $phone) === 1;
  }

  /**
   * Normalizes a phone number to E.164 format.
   *
   * @param string $phone
   *   The phone number to normalize.
   *
   * @return string
   *   The normalized phone number.
   */
  protected function normalizePhoneNumber(string $phone): string {
    // Remove all non-digit characters.
    $phone = preg_replace('/\D/', '', $phone) ?? '';

    // Add + prefix if not present.
    if (!str_starts_with($phone, '+')) {
      $phone = '+' . $phone;
    }

    return $phone;
  }

}
