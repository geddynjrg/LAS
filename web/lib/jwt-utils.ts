/**
 * JWT utility functions for decoding and validating tokens
 * This file does NOT have 'use server' so functions can be synchronous
 */

export function decodeJwtPayload(token: string): {
  uid?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
} | null {
  try {
    const tokenPayloadBase64 = token.split('.')[1];

    if (!tokenPayloadBase64) {
      return null;
    }

    return JSON.parse(atob(tokenPayloadBase64));
  } catch (_err) {
    return null;
  }
}
