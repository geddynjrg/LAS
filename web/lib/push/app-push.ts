import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export type PushDevice = {
  token: string;
  platform: string;
  email?: string;
  phone?: string;
  userId?: string;
  updatedAt: number;
};

export type PushMessage = {
  id: string;
  title: string;
  body: string;
  kind: 'otp' | 'loan_status' | 'system';
  phone?: string;
  email?: string;
  userId?: string;
  createdAt: number;
  meta?: Record<string, string>;
};

const STORE_PATH =
  process.env.APP_PUSH_STORE_PATH || '/tmp/uwezo-app-push.json';

const DEFAULT_PEER_NOTIFY_URLS = [
  'http://prod-web:3000/api/auth/app/notify',
  'http://web:3000/api/auth/app/notify',
  'http://majuu-applicant-portal:3000/api/auth/app/notify',
];

type Stores = {
  devices: Map<string, PushDevice>;
  inbox: Map<string, PushMessage[]>;
};

function stores(): Stores {
  const g = globalThis as unknown as {
    __appPushDevices?: Map<string, PushDevice>;
    __appPushInbox?: Map<string, PushMessage[]>;
    __appPushHydrated?: boolean;
  };
  if (!g.__appPushDevices) g.__appPushDevices = new Map();
  if (!g.__appPushInbox) g.__appPushInbox = new Map();
  if (!g.__appPushHydrated) {
    g.__appPushHydrated = true;
    hydrateFromDisk(g.__appPushDevices, g.__appPushInbox);
  }
  return { devices: g.__appPushDevices, inbox: g.__appPushInbox };
}

function hydrateFromDisk(
  devices: Map<string, PushDevice>,
  inbox: Map<string, PushMessage[]>,
) {
  try {
    if (!existsSync(STORE_PATH)) return;
    const parsed = JSON.parse(readFileSync(STORE_PATH, 'utf8')) as {
      devices?: PushDevice[];
      inbox?: Array<{ key: string; items: PushMessage[] }>;
    };
    for (const d of parsed.devices || []) {
      if (d?.token) devices.set(d.token, d);
    }
    for (const row of parsed.inbox || []) {
      if (row?.key && Array.isArray(row.items)) inbox.set(row.key, row.items);
    }
  } catch (e) {
    console.warn('[app-push] could not load store', e);
  }
}

function persistToDisk() {
  try {
    const { devices, inbox } = stores();
    mkdirSync(dirname(STORE_PATH), { recursive: true });
    writeFileSync(
      STORE_PATH,
      JSON.stringify({
        devices: [...devices.values()],
        inbox: [...inbox.entries()].map(([key, items]) => ({ key, items })),
      }),
      { encoding: 'utf8', mode: 0o600 },
    );
  } catch (e) {
    console.warn('[app-push] could not persist store', e);
  }
}

/** Canonical Kenyan mobile digits: 2547XXXXXXXX */
export function kenyanMsisdnDigits(raw?: string): string {
  if (!raw) return '';
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('2540') && d.length === 13) d = `254${d.slice(4)}`;
  if (d.startsWith('0') && d.length === 10) d = `254${d.slice(1)}`;
  if (d.length === 9 && d.startsWith('7')) d = `254${d}`;
  return d;
}

function phoneKeys(phone?: string): string[] {
  const canonical = kenyanMsisdnDigits(phone);
  if (!canonical) return [];
  const keys = new Set<string>([`p:${canonical}`]);
  const raw = String(phone || '').replace(/\D/g, '');
  if (raw) keys.add(`p:${raw}`);
  if (canonical.startsWith('254') && canonical.length === 12) {
    keys.add(`p:0${canonical.slice(3)}`);
    keys.add(`p:${canonical.slice(3)}`);
  }
  return [...keys];
}

function allKeys(parts: { phone?: string; email?: string; userId?: string }) {
  const keys: string[] = [];
  if (parts.userId) keys.push(`u:${parts.userId}`);
  keys.push(...phoneKeys(parts.phone));
  if (parts.email) keys.push(`e:${parts.email.trim().toLowerCase()}`);
  return [...new Set(keys.filter(Boolean))];
}

function otpDigits(body?: string): string {
  const match = String(body || '').match(/\b(\d{6})\b/);
  return match?.[1] ?? '';
}

function recentOtpDuplicate(
  inbox: Map<string, PushMessage[]>,
  keys: string[],
  input: { body: string; kind: string; phone?: string },
): PushMessage | null {
  if (input.kind !== 'otp') return null;
  const code = otpDigits(input.body);
  if (!code) return null;
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const k of keys) {
    for (const msg of inbox.get(k) || []) {
      if (msg.kind !== 'otp' || msg.createdAt < cutoff) continue;
      if (otpDigits(msg.body) === code) return msg;
    }
  }
  return null;
}

function keyFor(parts: { phone?: string; email?: string; userId?: string }) {
  return allKeys(parts)[0] || '';
}

export function registerPushDevice(input: {
  token: string;
  platform?: string;
  email?: string;
  phone?: string;
  userId?: string;
}) {
  const token = input.token.trim();
  if (!token) throw new Error('deviceToken is required');
  const msisdn = kenyanMsisdnDigits(input.phone);
  stores().devices.set(token, {
    token,
    platform: input.platform || 'android',
    email: input.email?.trim().toLowerCase(),
    phone: msisdn ? `+${msisdn}` : input.phone,
    userId: input.userId,
    updatedAt: Date.now(),
  });
  persistToDisk();
  return { ok: true };
}

export function listInbox(input: {
  phone?: string;
  email?: string;
  userId?: string;
}) {
  const keys = allKeys(input);
  if (!keys.length) return [];
  const inbox = stores().inbox;
  const byId = new Map<string, PushMessage>();
  for (const k of keys) {
    for (const msg of inbox.get(k) || []) {
      byId.set(msg.id, msg);
    }
  }
  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function phonesMatch(a?: string, b?: string) {
  const x = kenyanMsisdnDigits(a);
  const y = kenyanMsisdnDigits(b);
  return Boolean(x && y && x === y);
}

async function sendFcm(token: string, title: string, body: string) {
  const serverKey =
    process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY || '';
  if (!serverKey) {
    return { sent: false, reason: 'FCM_SERVER_KEY not configured' as const };
  }
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${serverKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body },
      data: { title, body },
      priority: 'high',
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      sent: false,
      reason: `FCM HTTP ${res.status}: ${text.slice(0, 120)}` as const,
    };
  }
  return { sent: true as const };
}

function selfNotifyUrls(): string[] {
  const app =
    `${process.env.NEXT_PUBLIC_APP_URL || ''} ${process.env.APP_URL || ''}`.toLowerCase();
  const extra: string[] = [];
  if (app.includes('loans-staging'))
    extra.push('http://web:3000/api/auth/app/notify');
  else if (app.includes('loans.uwezo'))
    extra.push('http://prod-web:3000/api/auth/app/notify');
  if (app.includes('majuu'))
    extra.push('http://majuu-applicant-portal:3000/api/auth/app/notify');
  return [
    process.env.APP_PUSH_SELF_NOTIFY_URL,
    process.env.NEXT_PUBLIC_APP_URL
      ? `${String(process.env.NEXT_PUBLIC_APP_URL).replace(/\/$/, '')}/api/auth/app/notify`
      : '',
    process.env.APP_URL
      ? `${String(process.env.APP_URL).replace(/\/$/, '')}/api/auth/app/notify`
      : '',
    ...extra,
  ]
    .map((u) => String(u || '').trim())
    .filter(Boolean);
}

function peerNotifyUrls(): string[] {
  const extra = String(process.env.APP_PUSH_PEER_NOTIFY_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const self = new Set(selfNotifyUrls());
  return [...new Set([...DEFAULT_PEER_NOTIFY_URLS, ...extra])].filter(
    (url) => !self.has(url),
  );
}

async function fanoutToPeers(input: {
  title: string;
  body: string;
  kind: 'otp' | 'loan_status' | 'system';
  phone?: string;
  email?: string;
  userId?: string;
}) {
  if (process.env.APP_PUSH_FANOUT === 'false') return;
  const secret = process.env.APP_PUSH_WEBHOOK_SECRET || '';
  if (!secret) return;
  const urls = peerNotifyUrls();
  await Promise.allSettled(
    urls.map(async (url) => {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 2500);
      try {
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${secret}`,
            'X-Uwezo-App-Push-Fanout': '1',
          },
          body: JSON.stringify({
            kind: input.kind,
            title: input.title,
            body: input.body,
            phone: input.phone,
            email: input.email,
            userId: input.userId,
          }),
          signal: ac.signal,
        });
      } catch {
        // Peer may be down or use a different webhook secret.
      } finally {
        clearTimeout(timer);
      }
    }),
  );
}

/**
 * Deliver OTP / loan status to registered app devices.
 * Always stores an in-app inbox copy; also attempts FCM when configured.
 */
export async function notifyAppUser(input: {
  title: string;
  body: string;
  kind: 'otp' | 'loan_status' | 'system';
  phone?: string;
  email?: string;
  userId?: string;
  meta?: Record<string, string>;
  skipFanout?: boolean;
}) {
  const keys = allKeys({
    userId: input.userId,
    phone: input.phone,
    email: input.email,
  });

  const { inbox, devices: deviceMap } = stores();
  const duplicate = recentOtpDuplicate(inbox, keys, input);
  if (duplicate) {
    if (!input.skipFanout) {
      await fanoutToPeers({
        title: input.title,
        body: input.body,
        kind: input.kind,
        phone: input.phone,
        email: input.email,
        userId: input.userId,
      });
    }
    return {
      ok: true,
      delivered: true,
      duplicate: true,
      inboxKeys: keys,
      devices: 0,
      fcmSent: 0,
      fcm: [],
      fcmConfigured: Boolean(
        process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY,
      ),
    };
  }

  const msg: PushMessage = {
    id: randomUUID(),
    title: input.title,
    body: input.body,
    kind: input.kind,
    phone: input.phone,
    email: input.email?.toLowerCase(),
    userId: input.userId,
    createdAt: Date.now(),
    meta: input.meta,
  };

  for (const k of keys) {
    const list = inbox.get(k) || [];
    list.unshift(msg);
    inbox.set(k, list.slice(0, 50));
  }
  persistToDisk();

  const devices = [...deviceMap.values()].filter((d) => {
    if (input.userId && d.userId === input.userId) return true;
    if (phonesMatch(input.phone, d.phone)) return true;
    if (input.email && d.email && d.email === input.email.trim().toLowerCase())
      return true;
    return false;
  });

  const fcmResults = [];
  let fcmSent = 0;
  for (const d of devices) {
    const r = await sendFcm(d.token, input.title, input.body);
    fcmResults.push(r);
    if (r.sent) fcmSent += 1;
  }

  if (!input.skipFanout) {
    await fanoutToPeers({
      title: input.title,
      body: input.body,
      kind: input.kind,
      phone: input.phone,
      email: input.email,
      userId: input.userId,
    });
  }

  // Inbox is written for polling even when FCM is off / no device token yet.
  const delivered = keys.length > 0;

  return {
    ok: true,
    delivered,
    inboxKeys: keys,
    devices: devices.length,
    fcmSent,
    fcm: fcmResults,
    fcmConfigured: Boolean(
      process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY,
    ),
  };
}

export function countRegisteredDevices(input: {
  phone?: string;
  email?: string;
  userId?: string;
}): number {
  return [...stores().devices.values()].filter((d) => {
    if (input.userId && d.userId === input.userId) return true;
    if (phonesMatch(input.phone, d.phone)) return true;
    if (input.email && d.email && d.email === input.email.trim().toLowerCase())
      return true;
    return false;
  }).length;
}

export function pushEnvDocs() {
  return {
    FCM_SERVER_KEY:
      'Legacy FCM server key for HTTP push (optional). Without it, OTP/status still land in app inbox API.',
    FIREBASE_SERVER_KEY: 'Alias of FCM_SERVER_KEY',
    APP_PUSH_ENABLED: 'Set to "false" to disable dual SMS+push delivery',
    APP_PUSH_STORE_PATH:
      'JSON file used so inbox/devices survive process restarts',
    APP_PUSH_PEER_NOTIFY_URLS:
      'Comma-separated extra notify URLs (majuu/loans/staging)',
  };
}

export { keyFor };
