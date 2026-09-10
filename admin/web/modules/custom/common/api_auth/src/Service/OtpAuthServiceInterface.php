<?php

namespace Drupal\api_auth\Service;

use Drupal\user\UserInterface;

/**
 * Interface for OTP-based authentication service.
 */
interface OtpAuthServiceInterface {

  /**
   * Finds an existing user by phone number or creates a new one.
   *
   * @param string $phone_number
   *   The phone number to search for.
   *
   * @return \Drupal\user\UserInterface
   *   The user entity (existing or newly created).
   */
  public function findOrCreateUserByPhone(string $phone_number): UserInterface;

  /**
   * Validates a phone number format.
   *
   * @param string $phone_number
   *   The phone number to validate.
   *
   * @return bool
   *   TRUE if the phone number is valid, FALSE otherwise.
   */
  public function isValidPhoneNumber(string $phone_number): bool;

  /**
   * Checks if an OTP request is valid and not expired.
   *
   * @param string $request_id
   *   The request ID to check.
   *
   * @return bool
   *   TRUE if the request is valid, FALSE otherwise.
   */
  public function isValidRequest(string $request_id): bool;

  /**
   * Requests an OTP for the given phone number.
   *
   * Tries SMS first; on failure falls back to the account email (or optional
   * email argument). WhatsApp failover is not enabled yet.
   *
   * @param string $phone_number
   *   The phone number.
   * @param string|null $email
   *   Optional email for failover when SMS fails and no linked email exists.
   *
   * @return array
   *   Result payload with success flag and request metadata.
   */
  public function requestOtp(string $phone_number, ?string $email = NULL): array;

  /**
   * Verifies an OTP code and logs in the user.
   *
   * @param string $request_id
   *   The request ID returned from requestOtp().
   * @param string $otp_code
   *   The OTP code to verify.
   *
   * @return array
   *   An array containing:
   *   - success: Boolean indicating success/failure
   *   - access_token: JWT access token (if successful)
   *   - refresh_token: JWT refresh token (if successful)
   *   - expires_in: Token expiration time in seconds (if successful)
   *   - user: User information array (if successful)
   *   - error: Error message if success is false
   */
  public function verifyOtp(string $request_id, string $otp_code): array;

}
