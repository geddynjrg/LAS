import {
  QR_SESSION_COOKIE,
  buildQrPayload,
  createQrChallenge,
  getQrConfig,
  isQrLoginEnabled,
} from '@/lib/auth/qr-login';
import { optionsCors, withCors } from '@/lib/auth/cors-app';
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function shouldUseSecureCookies(): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  if (appUrl.startsWith('http://')) return false;
  return process.env.NODE_ENV === 'production';
}

export async function POST(request: Request) {
  if (!isQrLoginEnabled()) {
    return withCors(
      request,
      NextResponse.json(
        {
          ok: false,
          error:
            'QR login is currently disabled. Use eCitizen, email/password, or phone OTP.',
        },
        { status: 403 },
      ),
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const source = body.source === 'chat' ? 'chat' : 'web';
  const url = new URL(request.url);
  const configured = process.env.NEXT_PUBLIC_APP_URL || '';
  const origin = (configured || `${url.protocol}//${url.host}`).replace(
    /\/$/,
    '',
  );
  const sessionId = randomUUID();
  const record = createQrChallenge({ origin, sessionId, source });
  const cfg = getQrConfig();
  const payload = buildQrPayload(record);

  const cookieStore = await cookies();
  cookieStore.set(QR_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: 'lax',
    path: '/',
    maxAge: Math.ceil(cfg.ttlMs / 1000),
  });

  return withCors(
    request,
    NextResponse.json({
      ok: true,
      challengeId: record.id,
      expiresAt: record.expiresAt,
      expiresIn: Math.ceil((record.expiresAt - Date.now()) / 1000),
      pollIntervalMs: cfg.pollMs,
      qrPayload: payload,
      qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&ecc=M&data=${encodeURIComponent(payload)}`,
      message:
        'Scan this QR with the Uwezo Fund app, verify your phone or email, then confirm to finish signing in here.',
    }),
  );
}

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}
