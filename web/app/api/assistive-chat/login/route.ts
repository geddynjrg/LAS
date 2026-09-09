import { login } from '@/lib/api/login';
import { OtpNeedEmailError, requestOtp } from '@/lib/api/otp-request';
import { verifyOtp } from '@/lib/api/otp-verify';
import { optionsCors, withCors } from '@/lib/auth/cors-app';
import { createSession, getSession } from '@/lib/session';
import { formatKenyanPhoneForApi } from '@/lib/utils/string';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Chat login via Drupal: password, mobile OTP, or eCitizen redirect hint.
 * Never logs passwords or OTP codes.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return withCors(
      request,
      NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }),
    );
  }

  const method = String(body.method || 'password').toLowerCase();

  if (method === 'phone_send' || method === 'otp_send') {
    const phone = String(body.phone || body.username || '').trim();
    const email = String(body.email || '').trim();
    if (!phone) {
      return withCors(
        request,
        NextResponse.json(
          {
            ok: false,
            error: 'Enter a Kenyan mobile number (e.g. 07… or +254…).',
          },
          { status: 400 },
        ),
      );
    }
    try {
      const normalized = formatKenyanPhoneForApi(phone);
      if (!normalized) {
        return withCors(
          request,
          NextResponse.json(
            {
              ok: false,
              error: 'Enter a valid Kenyan mobile number (e.g. 07… or +254…).',
            },
            { status: 400 },
          ),
        );
      }
      const result = await requestOtp({
        phone: normalized,
        email: email || undefined,
      });
      return withCors(
        request,
        NextResponse.json({
          ok: true,
          method: 'phone',
          requestId: result.request_id,
          channel: result.delivery_channel || 'sms',
          maskedEmail: result.masked_email || null,
          message:
            result.message ||
            'OTP sent by SMS. Enter the 6-digit code here. First-time numbers follow the same account creation as portal phone login.',
        }),
      );
    } catch (e) {
      if (e instanceof OtpNeedEmailError) {
        return withCors(
          request,
          NextResponse.json(
            { ok: false, needEmail: true, error: e.message },
            { status: 400 },
          ),
        );
      }
      const msg = e instanceof Error ? e.message : 'Could not send OTP';
      const safe =
        msg.startsWith('{') || msg.startsWith('[') || msg.length > 180
          ? 'Could not send OTP. Try eCitizen or email/password login.'
          : msg;
      return withCors(
        request,
        NextResponse.json({ ok: false, error: safe }, { status: 400 }),
      );
    }
  }

  if (method === 'phone_verify' || method === 'otp_verify') {
    const requestId = String(body.requestId || body.request_id || '').trim();
    const otpCode = String(body.otp || body.otp_code || body.code || '').trim();
    if (!requestId || !otpCode) {
      return withCors(
        request,
        NextResponse.json(
          { ok: false, error: 'OTP code and request id are required.' },
          { status: 400 },
        ),
      );
    }
    try {
      const result = await verifyOtp({
        request_id: requestId,
        otp_code: otpCode,
      });
      await createSession({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      });
      return withCors(
        request,
        NextResponse.json({
          ok: true,
          method: 'phone',
          created: Boolean(result.user?.created),
          message: result.user?.created
            ? 'Account created and signed in with mobile OTP.'
            : 'Signed in with mobile OTP.',
        }),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Invalid or expired OTP';
      return withCors(
        request,
        NextResponse.json({ ok: false, error: msg }, { status: 401 }),
      );
    }
  }

  if (method === 'ecitizen') {
    const callbackUrl = String(body.callbackUrl || '/').trim() || '/';
    const redirect = `/login?type=ecitizen&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    return withCors(
      request,
      NextResponse.json({
        ok: true,
        method: 'ecitizen',
        redirect,
        message:
          'eCitizen opens on the login page (OAuth via admin). Complete sign-in in the browser, then reopen Help — your session cookies will already be set. In-chat eCitizen password/OTP is not supported (redirect/captcha).',
      }),
    );
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!username || !password) {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, error: 'Username and password are required.' },
        { status: 400 },
      ),
    );
  }

  try {
    const res = await login({ username, password });
    await createSession({
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    });
    return withCors(
      request,
      NextResponse.json({
        ok: true,
        method: 'password',
        username,
        message: 'Signed in successfully.',
      }),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid email or password';
    return withCors(
      request,
      NextResponse.json({ ok: false, error: msg }, { status: 401 }),
    );
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  return withCors(
    request,
    NextResponse.json({
      authenticated: Boolean(session),
    }),
  );
}

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}
