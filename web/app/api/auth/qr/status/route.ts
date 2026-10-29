import {
  QR_SESSION_COOKIE,
  consumeQrChallenge,
  getQrChallenge,
  isQrLoginEnabled,
} from '@/lib/auth/qr-login';
import { optionsCors, withCors } from '@/lib/auth/cors-app';
import { createSession } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!isQrLoginEnabled()) {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, status: 'disabled', error: 'QR login is disabled.' },
        { status: 403 },
      ),
    );
  }

  const url = new URL(request.url);
  const challengeId = String(url.searchParams.get('challengeId') || '').trim();
  if (!challengeId) {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, error: 'challengeId is required.' },
        { status: 400 },
      ),
    );
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(QR_SESSION_COOKIE)?.value || '';
  const record = getQrChallenge(challengeId);

  if (!record) {
    return withCors(
      request,
      NextResponse.json({
        ok: true,
        status: 'expired',
        message: 'This QR code expired or was already used. Start again.',
      }),
    );
  }

  if (!sessionId || sessionId !== record.sessionId) {
    return withCors(
      request,
      NextResponse.json(
        {
          ok: false,
          status: 'forbidden',
          error: 'This QR login belongs to another browser session.',
        },
        { status: 403 },
      ),
    );
  }

  if (record.status === 'pending') {
    return withCors(
      request,
      NextResponse.json({
        ok: true,
        status: 'pending',
        expiresAt: record.expiresAt,
        expiresIn: Math.max(
          0,
          Math.ceil((record.expiresAt - Date.now()) / 1000),
        ),
      }),
    );
  }

  if (record.status === 'expired') {
    return withCors(
      request,
      NextResponse.json({
        ok: true,
        status: 'expired',
        message: 'QR code expired. Generate a new one.',
      }),
    );
  }

  if (record.status === 'consumed') {
    return withCors(
      request,
      NextResponse.json({
        ok: true,
        status: 'consumed',
        message: 'This QR login was already completed.',
      }),
    );
  }

  if (record.status === 'confirmed') {
    const consumed = consumeQrChallenge(challengeId);
    if (!consumed) {
      return withCors(
        request,
        NextResponse.json(
          { ok: false, status: 'error', error: 'Challenge tokens missing.' },
          { status: 500 },
        ),
      );
    }

    await createSession({
      accessToken: consumed.tokens.accessToken,
      refreshToken: consumed.tokens.refreshToken,
    });
    cookieStore.set(QR_SESSION_COOKIE, '', { expires: new Date(0), path: '/' });

    return withCors(
      request,
      NextResponse.json({
        ok: true,
        status: 'ready',
        message: 'Signed in via Uwezo Fund app QR.',
      }),
    );
  }

  return withCors(
    request,
    NextResponse.json({ ok: true, status: record.status }),
  );
}

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}
