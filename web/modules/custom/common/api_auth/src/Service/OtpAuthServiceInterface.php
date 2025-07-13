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
   * Initiates an OTP request for a phone number.
   *
   * @param string $phone_number
   *   The phone number to send the OTP to.
   *
   * @return array
   *   An array containing:
   *   - success: Boolean indicating success/failure
   *   - request_id: Unique identifier for this OTP request
   *   - message: Human-readable message
   *   - expires_in: Time until OTP expires in seconds
   *   - error: Error message if success is false
   */
  public function requestOtp(string $phone_number): array;

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
