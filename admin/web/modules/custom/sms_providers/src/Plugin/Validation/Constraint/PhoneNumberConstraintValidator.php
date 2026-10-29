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
   * Accepts common Kenyan inputs (07XXXXXXXX, 7XXXXXXXX, 2547XXXXXXXX)
   * and converts them to +254XXXXXXXXX before E.164 validation.
   *
   * @param string $phone
   *   The phone number to normalize.
   *
   * @return string
   *   The normalized phone number.
   */
  protected function normalizePhoneNumber(string $phone): string {
    $digits = preg_replace('/\D/', '', $phone) ?? '';

    if ($digits === '') {
      return $phone;
    }

    // Kenyan local with leading 0: 07XXXXXXXX / 01XXXXXXXX -> +254…
    if (str_starts_with($digits, '0') && \strlen($digits) === 10) {
      return '+254' . substr($digits, 1);
    }

    // Already has Kenya country code.
    if (str_starts_with($digits, '254') && \strlen($digits) === 12) {
      return '+' . $digits;
    }

    // 9-digit Kenyan mobile without prefix (7XXXXXXXX / 1XXXXXXXX).
    if (\strlen($digits) === 9 && preg_match('/^[17]/', $digits)) {
      return '+254' . $digits;
    }

    return '+' . ltrim($digits, '+');
  }

}
