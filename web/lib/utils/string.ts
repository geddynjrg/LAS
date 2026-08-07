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

/**
 * Resolve a valid 9-digit Kenyan mobile from the first matching source.
 * Used by login submit to avoid stale React state / hidden-field desync.
 */
export function resolveKenyanPhoneFromSources(
  ...sources: Array<string | null | undefined>
): string | null {
  for (const source of sources) {
    if (!source) continue;
    const normalized = normalizeKenyanPhoneLocal(source);
    if (normalized) return normalized;
  }
  return null;
}

/**
 * Best-effort phone value for form validation (client + server).
 * Accepts duplicate FormData values; prefers the first valid normalization.
 */
export function coercePhoneFormValue(value: unknown): string | undefined {
  if (value == null) return undefined;

  if (Array.isArray(value)) {
    const normalized = resolveKenyanPhoneFromSources(...value.map(String));
    if (normalized) return normalized;
    const digits = value
      .map((entry) => String(entry).replace(/\D/g, ''))
      .find((entry) => entry.length > 0);
    return digits || undefined;
  }

  if (typeof value !== 'string') return undefined;

  return (
    (normalizeKenyanPhoneLocal(value) ?? value.replace(/\D/g, '')) || undefined
  );
}

/** Phone value to write into FormData on submit (sync ref > DOM ref > state). */
export function resolveKenyanPhoneForSubmit(
  ...sources: Array<string | null | undefined>
): string {
  const normalized = resolveKenyanPhoneFromSources(...sources);
  if (normalized) return normalized;

  for (const source of sources) {
    if (!source) continue;
    const digits = source.replace(/\D/g, '');
    if (digits) return digits;
  }

  return '';
}

/** Format a Kenyan phone number for API submission (+254XXXXXXXXX). */
export function formatKenyanPhoneForApi(phone: string): string | null {
  const local = normalizeKenyanPhoneLocal(phone);
  return local ? `+254${local}` : null;
}

/** Compare two Kenyan phone inputs after normalizing to +254XXXXXXXXX. */
export function phonesEqual(
  left?: string | null,
  right?: string | null,
): boolean {
  const normalizedLeft = left ? formatKenyanPhoneForApi(left) : null;
  const normalizedRight = right ? formatKenyanPhoneForApi(right) : null;

  return (
    normalizedLeft !== null &&
    normalizedRight !== null &&
    normalizedLeft === normalizedRight
  );
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
