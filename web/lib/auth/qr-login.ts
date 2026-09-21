import { randomUUID } from 'node:crypto';

export type QrChallengeStatus = 'pending' | 'confirmed' | 'consumed' | 'expired';

export type QrChallengeRecord = {
  id: string;
  origin: string;
  sessionId: string;
  source: 'web' | 'chat';
  createdAt: number;
  expiresAt: number;
  status: QrChallengeStatus;
  confirmedAt?: number;
  consumedAt?: number;
  accessToken?: string;
  refreshToken?: string;
};

const TTL_MS = Number(process.env.QR_LOGIN_TTL_MS || 90000);
const POLL_MS = Number(process.env.QR_LOGIN_POLL_MS || 2000);
const MAX_TTL_MS = 120000;
const MIN_TTL_MS = 60000;
const resolvedTtl = Math.min(MAX_TTL_MS, Math.max(MIN_TTL_MS, TTL_MS));

/** QR login stays enabled unless QR_LOGIN_ENABLED_UNTIL is a parseable cutoff date. */
const INDEFINITE = 'indefinite';

function getStore(): Map<string, QrChallengeRecord> {
  const g = globalThis as unknown as {
    __qrChallengeStore?: Map<string, QrChallengeRecord>;
  };
  if (!g.__qrChallengeStore) {
    g.__qrChallengeStore = new Map<string, QrChallengeRecord>();
  }
  return g.__qrChallengeStore;
}

function resolveEnabledUntil(): string {
  return (
    process.env.QR_LOGIN_ENABLED_UNTIL ||
    process.env.NEXT_PUBLIC_QR_LOGIN_ENABLED_UNTIL ||
    INDEFINITE
  );
}

export function isQrLoginEnabled(now = Date.now()): boolean {
  const untilRaw = resolveEnabledUntil().trim();
  if (!untilRaw || /^(never|indefinite|unlimited|permanent)$/i.test(untilRaw)) {
    return true;
  }
  const until = Date.parse(untilRaw);
  if (Number.isNaN(until)) return true;
  return now <= until;
}

export function getQrConfig() {
  return {
    ttlMs: resolvedTtl,
    pollMs: POLL_MS,
    enabledUntil: resolveEnabledUntil(),
  };
}

export function cleanupExpiredChallenges(now = Date.now()) {
  const store = getStore();
  for (const [id, item] of store.entries()) {
    if (item.expiresAt <= now || item.status === 'consumed') {
      store.delete(id);
    }
  }
}

export function createQrChallenge(input: {
  origin: string;
  sessionId: string;
  source: 'web' | 'chat';
}) {
  cleanupExpiredChallenges();
  const now = Date.now();
  const id = randomUUID();
  const record: QrChallengeRecord = {
    id,
    origin: input.origin,
    sessionId: input.sessionId,
    source: input.source,
    createdAt: now,
    expiresAt: now + resolvedTtl,
    status: 'pending',
  };
  getStore().set(id, record);
  return record;
}

export function getQrChallenge(id: string): QrChallengeRecord | null {
  const record = getStore().get(id) || null;
  if (!record) return null;
  if (record.expiresAt <= Date.now() && record.status === 'pending') {
    record.status = 'expired';
    getStore().set(id, record);
  }
  return record;
}

export function confirmQrChallenge(
  id: string,
  tokens: { accessToken: string; refreshToken: string },
) {
  const record = getQrChallenge(id);
  if (!record) return null;
  if (record.status !== 'pending') return record;
  record.status = 'confirmed';
  record.confirmedAt = Date.now();
  record.accessToken = tokens.accessToken;
  record.refreshToken = tokens.refreshToken;
  getStore().set(id, record);
  return record;
}

export function consumeQrChallenge(id: string): {
  record: QrChallengeRecord;
  tokens: { accessToken: string; refreshToken: string };
} | null {
  const record = getQrChallenge(id);
  if (!record) return null;
  if (record.status !== 'confirmed') return null;
  if (!record.accessToken || !record.refreshToken) return null;
  record.status = 'consumed';
  record.consumedAt = Date.now();
  const tokens = {
    accessToken: record.accessToken,
    refreshToken: record.refreshToken,
  };
  delete record.accessToken;
  delete record.refreshToken;
  getStore().set(id, record);
  return { record, tokens };
}

export function buildQrPayload(record: QrChallengeRecord) {
  return JSON.stringify({
    v: 1,
    type: 'uwezo_qr_login',
    challengeId: record.id,
    origin: record.origin,
    expiresAt: record.expiresAt,
  });
}

export const QR_SESSION_COOKIE = 'qr-login-session';
