const KENYA_LOCAL_PHONE_REGEX = /^[17]\d{8}$/;

/**
 * Normalize flexible Kenyan phone input to a 9-digit local number (no country code).
 * Accepts: 0720501239, 254720501239, +254720501239, 720501239
 */
export function normalizeKenyanPhoneLocal(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;

  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('254') && digits.length === 12) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0') && digits.length === 10) {
    digits = digits.slice(1);
  }

  if (!KENYA_LOCAL_PHONE_REGEX.test(digits)) {
    return null;
  }

  return digits;
}

/** Returns true when input can be normalized to a valid Kenyan mobile number. */
export function isValidKenyanPhoneNumber(phone: string): boolean {
  return normalizeKenyanPhoneLocal(phone) !== null;
}

/** Format a Kenyan phone number for API submission (+254XXXXXXXXX). */
export function formatKenyanPhoneForApi(phone: string): string | null {
  const local = normalizeKenyanPhoneLocal(phone);
  return local ? `+254${local}` : null;
}

/**
 * Capitalizes the first letter of each word in a string
 * Handles special cases like hyphens, apostrophes, and multiple spaces
 * @param text - The text to capitalize
 * @returns The text with each word's first letter capitalized
 */
export function capitalizeWords(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/'\w/g, (match) => match.toUpperCase());
}