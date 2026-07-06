/** Fast retry: every 5 minutes for transient errors (timeout, 429, Horizon lag). */
export const LMS_FAST_RETRY_INTERVAL_MS = 5 * 60 * 1000;

/** Slow retry: every 6 hours for persistent but recoverable failures. */
export const LMS_SLOW_RETRY_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Max attempts in the fast tier (5 min × 12 = 1 hour). */
export const LMS_FAST_MAX_ATTEMPTS = 12;

/** Max attempts in the slow tier (6 h × 4 = 24 hours). */
export const LMS_SLOW_MAX_ATTEMPTS = 4;

export const LMS_MAX_TOTAL_ATTEMPTS =
  LMS_FAST_MAX_ATTEMPTS + LMS_SLOW_MAX_ATTEMPTS;

/** Marks an application as permanently failed — excluded from auto-retry queries. */
export const LMS_PERMANENT_ATTEMPTS = 999;

const NON_RETRYABLE_PATTERNS = [
  'lms_api_url or lms_api_key is not configured',
  'application must be synced to drupal before lms import',
  'application not found',
  'unauthorized',
  'invalid api key',
  'forbidden',
  'ip_not_allowed',
  'permanent_failure',
] as const;

export function isNonRetryableLmsError(message?: string | null): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return NON_RETRYABLE_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function getLmsRetryDelayMs(attempts: number): number | null {
  if (attempts >= LMS_MAX_TOTAL_ATTEMPTS) return null;
  if (attempts < LMS_FAST_MAX_ATTEMPTS) return LMS_FAST_RETRY_INTERVAL_MS;
  return LMS_SLOW_RETRY_INTERVAL_MS;
}

export function computeLmsNextRetryAt(
  attempts: number,
  from = new Date(),
): Date | null {
  const delayMs = getLmsRetryDelayMs(attempts);
  if (delayMs == null) return null;
  return new Date(from.getTime() + delayMs);
}

export function isReadyForLmsRetry(
  lmsNextRetryAt: Date | null | undefined,
  lmsLastSyncAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (lmsNextRetryAt != null) {
    return lmsNextRetryAt <= now;
  }

  if (lmsLastSyncAt == null) {
    return true;
  }

  return lmsLastSyncAt.getTime() <= now.getTime() - LMS_FAST_RETRY_INTERVAL_MS;
}

export function describeLmsRetryTier(attempts: number): string {
  if (attempts >= LMS_MAX_TOTAL_ATTEMPTS) return 'exhausted';
  if (attempts < LMS_FAST_MAX_ATTEMPTS) return 'fast';
  return 'slow';
}
