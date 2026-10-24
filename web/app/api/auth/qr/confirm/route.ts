import { login } from '@/lib/api/login';
import { verifyOtp } from '@/lib/api/otp-verify';
import { optionsCors, withCors } from '@/lib/auth/cors-app';
import {
  confirmQrChallenge,
  getQrChallenge,
  isQrLoginEnabled,
} from '@/lib/auth/qr-login';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * App confirms a QR challenge after Option B verification on loans.
 * Prefer phone OTP or email/password so the browser receives a full token pair.
 */
export async function POST(request: Request) {
  if (!isQrLoginEnabled()) {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, error: 'QR login is disabled.' },
        { status: 403 },
      ),
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return withCors(
      request,
      NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }),
    );
  }

  const challengeId = String(body.challengeId || '').trim();
  if (!challengeId) {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, error: 'challengeId is required.' },
        { status: 400 },
      ),
    );
  }

  const record = getQrChallenge(challengeId);
  if (!record || record.status === 'expired') {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, error: 'QR challenge expired or not found.' },
        { status: 410 },
      ),
    );
  }
  if (record.status === 'consumed') {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, error: 'QR challenge already used.' },
        { status: 409 },
      ),
    );
  }
  if (record.status === 'confirmed') {
    return withCors(
      request,
      NextResponse.json({
        ok: true,
        status: 'confirmed',
        message: 'Already confirmed. Waiting for the browser to finish login.',
      }),
    );
  }

  const requestOrigin = new URL(request.url).origin.replace(/\/$/, '');
  const configured = (process.env.NEXT_PUBLIC_APP_URL || requestOrigin).replace(
    /\/$/,
    '',
  );
  if (
    record.origin.replace(/\/$/, '') !== configured &&
    record.origin.replace(/\/$/, '') !== requestOrigin
  ) {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, error: 'Challenge origin mismatch.' },
        { status: 400 },
      ),
    );
  }

  let tokens: { accessToken: string; refreshToken: string } | null = null;
  const method = String(body.method || 'phone_verify').toLowerCase();
  const bearer = (request.headers.get('authorization') || '').replace(
    /^Bearer\s+/i,
    '',
  );
  const presentedAccess = String(
    body.accessToken || body.access_token || bearer || '',
  ).trim();
  const presentedRefresh = String(
    body.refreshToken || body.refresh_token || '',
  ).trim();

  try {
    if (method === 'phone_verify' || method === 'otp_verify') {
      const requestId = String(body.requestId || body.request_id || '').trim();
      const otp = String(body.otp || body.otp_code || body.code || '').trim();
      if (!requestId || !otp) {
        return withCors(
          request,
          NextResponse.json(
            { ok: false, error: 'OTP code and request id are required.' },
            { status: 400 },
          ),
        );
      }
      const result = await verifyOtp({ request_id: requestId, otp_code: otp });
      tokens = {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      };
    } else if (method === 'password' || method === 'email') {
      const username = String(body.username || body.email || '')
        .trim()
        .toLowerCase();
      const password = String(body.password || '');
      if (!username || !password) {
        return withCors(
          request,
          NextResponse.json(
            { ok: false, error: 'Email and password are required.' },
            { status: 400 },
          ),
        );
      }
      const res = await login({ username, password });
      tokens = {
        accessToken: res.data.access_token,
        refreshToken: res.data.refresh_token,
      };
    } else if (
      method === 'session' ||
      method === 'bearer' ||
      method === 'access_token'
    ) {
      // Option A: reuse tokens from the already signed-in app session.
      const apiUrl = (process.env.API_URL || '').replace(/\/$/, '');
      const apiHeaders = {
        Accept: 'application/json',
        ...(process.env.EXTERNAL_API_KEY
          ? { 'X-API-Key': process.env.EXTERNAL_API_KEY }
          : {}),
      };

      async function refreshLoansTokens(refreshToken: string) {
        if (!apiUrl || !refreshToken) return null;
        const refreshed = await fetch(`${apiUrl}/api/v1/user/token/refresh`, {
          method: 'POST',
          headers: {
            ...apiHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!refreshed.ok) return null;
        const json = (await refreshed.json().catch(() => ({}))) as {
          data?: { access_token?: string; refresh_token?: string };
        };
        const accessToken = String(json.data?.access_token || '');
        const nextRefresh = String(json.data?.refresh_token || refreshToken);
        if (!accessToken) return null;
        return { accessToken, refreshToken: nextRefresh };
      }

      let access = presentedAccess;
      let refresh = presentedRefresh;
      if (!access && refresh) {
        const renewed = await refreshLoansTokens(refresh);
        if (renewed) {
          access = renewed.accessToken;
          refresh = renewed.refreshToken;
        }
      }
      if (!access || !refresh) {
        return withCors(
          request,
          NextResponse.json(
            {
              ok: false,
              needAuth: true,
              error:
                'Could not confirm with the saved app session. Verify with OTP or email/password — you do not need to sign out of the app.',
            },
            { status: 401 },
          ),
        );
      }
      if (apiUrl) {
        const profile = await fetch(`${apiUrl}/api/v1/user/profile`, {
          headers: {
            ...apiHeaders,
            Authorization: `Bearer ${access}`,
          },
        });
        if (!profile.ok) {
          const renewed = await refreshLoansTokens(refresh);
          if (!renewed) {
            return withCors(
              request,
              NextResponse.json(
                {
                  ok: false,
                  needAuth: true,
                  error:
                    'Could not confirm with the saved app session. Verify with OTP or email/password — you do not need to sign out of the app.',
                },
                { status: 401 },
              ),
            );
          }
          access = renewed.accessToken;
          refresh = renewed.refreshToken;
        }
      }
      tokens = {
        accessToken: access,
        refreshToken: refresh,
      };
    } else {
      return withCors(
        request,
        NextResponse.json(
          {
            ok: false,
            needAuth: true,
            error:
              'Confirm with phone OTP or email/password so the browser can receive a full session.',
          },
          { status: 401 },
        ),
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Verification failed';
    return withCors(
      request,
      NextResponse.json({ ok: false, error: msg }, { status: 401 }),
    );
  }

  if (!tokens?.accessToken || !tokens.refreshToken) {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, error: 'Could not issue login tokens.' },
        { status: 500 },
      ),
    );
  }

  const confirmed = confirmQrChallenge(challengeId, tokens);
  if (!confirmed || confirmed.status !== 'confirmed') {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, error: 'Could not confirm QR challenge.' },
        { status: 409 },
      ),
    );
  }

  return withCors(
    request,
    NextResponse.json({
      ok: true,
      status: 'confirmed',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message:
        'Confirmed. Return to the browser — it will finish signing you in automatically.',
    }),
  );
}

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}
