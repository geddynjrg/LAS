import { randomUUID } from 'node:crypto';

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

function deviceStore(): Map<string, PushDevice> {
  const g = globalThis as unknown as { __appPushDevices?: Map<string, PushDevice> };
  if (!g.__appPushDevices) g.__appPushDevices = new Map();
  return g.__appPushDevices;
}

function inboxStore(): Map<string, PushMessage[]> {
  const g = globalThis as unknown as { __appPushInbox?: Map<string, PushMessage[]> };
  if (!g.__appPushInbox) g.__appPushInbox = new Map();
  return g.__appPushInbox;
}

function keyFor(parts: { phone?: string; email?: string; userId?: string }) {
  if (parts.userId) return `u:${parts.userId}`;
  if (parts.phone) return `p:${parts.phone.replace(/\D/g, '')}`;
  if (parts.email) return `e:${parts.email.trim().toLowerCase()}`;
  return '';
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
  deviceStore().set(token, {
    token,
    platform: input.platform || 'android',
    email: input.email?.trim().toLowerCase(),
    phone: input.phone,
    userId: input.userId,
    updatedAt: Date.now(),
  });
  return { ok: true };
}

export function listInbox(input: {
  phone?: string;
  email?: string;
  userId?: string;
}) {
  const k = keyFor(input);
  if (!k) return [];
  return inboxStore().get(k) || [];
}

async function sendFcm(token: string, title: string, body: string) {
  const serverKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY || '';
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
    return { sent: false, reason: `FCM HTTP ${res.status}: ${text.slice(0, 120)}` as const };
  }
  return { sent: true as const };
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
}) {
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

  const keys = [
    keyFor({ userId: input.userId }),
    keyFor({ phone: input.phone }),
    keyFor({ email: input.email }),
  ].filter(Boolean);

  const inbox = inboxStore();
  for (const k of keys) {
    const list = inbox.get(k) || [];
    list.unshift(msg);
    inbox.set(k, list.slice(0, 50));
  }

  const devices = [...deviceStore().values()].filter((d) => {
    if (input.userId && d.userId === input.userId) return true;
    if (input.phone && d.phone && d.phone.replace(/\D/g, '') === input.phone.replace(/\D/g, ''))
      return true;
    if (
      input.email &&
      d.email &&
      d.email === input.email.trim().toLowerCase()
    )
      return true;
    return false;
  });

  const fcmResults = [];
  for (const d of devices) {
    fcmResults.push(await sendFcm(d.token, input.title, input.body));
  }

  return {
    ok: true,
    inboxKeys: keys,
    devices: devices.length,
    fcm: fcmResults,
    fcmConfigured: Boolean(
      process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY,
    ),
  };
}

export function pushEnvDocs() {
  return {
    FCM_SERVER_KEY:
      'Legacy FCM server key for HTTP push (optional). Without it, OTP/status still land in app inbox API.',
    FIREBASE_SERVER_KEY: 'Alias of FCM_SERVER_KEY',
    APP_PUSH_ENABLED: 'Set to "false" to disable dual SMS+push delivery',
  };
}
