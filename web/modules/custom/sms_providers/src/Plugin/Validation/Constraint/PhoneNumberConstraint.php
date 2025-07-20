<?php

declare(strict_types=1);

namespace Drupal\sms_providers\Plugin\Validation\Constraint;

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Validation\Attribute\Constraint;
use Symfony\Component\Validator\Constraint as SymfonyConstraint;

/**
 * Checks that the value is a valid phone number in E.164 format.
 */
#[Constraint(
  id: 'PhoneNumber',
  label: new TranslatableMarkup('Valid phone number', [], ['context' => 'Validation']),
)]
class PhoneNumberConstraint extends SymfonyConstraint {

  /**
   * Maximum number of digits (excluding country code).
   */
  public int $maxDigits = 15;

  /**
   * The default violation message.
   */
  public string $message = 'The phone number "@value" is not valid. Please enter a phone number in international format (e.g., +254712345678).';

  /**
   * Minimum number of digits (excluding country code).
   */
  public int $minDigits = 7;

}
