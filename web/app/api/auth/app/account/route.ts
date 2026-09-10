import { optionsCors, withCors } from '@/lib/auth/cors-app';
import { login } from '@/lib/api/login';
import { register } from '@/lib/api/register';
import { passwordResetRequest } from '@/lib/api/password-reset-request';
import { verifyOtp } from '@/lib/api/otp-verify';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Loans app account endpoints (Option A) via Drupal.
 * login_or_register attempts login, then register+login when missing.
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

  const action = String(body.action || '').toLowerCase();
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  const password = String(body.password || '');
  const phone = String(body.phone || '').trim();

  try {
    if (action === 'login_or_register') {
      if (!email || !password) {
        return withCors(
          request,
          NextResponse.json(
            { ok: false, error: 'Email and password are required.' },
            { status: 400 },
          ),
        );
      }
      try {
        const res = await login({ username: email, password });
        return withCors(
          request,
          NextResponse.json({
            ok: true,
            accessToken: res.data.access_token,
            refreshToken: res.data.refresh_token,
            created: false,
            message: 'Signed in.',
          }),
        );
      } catch (loginErr) {
        if (body.createIfMissing === false) throw loginErr;
        // Upsert: create then login.
        const username = email.split('@')[0] || email;
        await register({ username, email, password });
        const res = await login({ username: email, password });
        return withCors(
          request,
          NextResponse.json({
            ok: true,
            accessToken: res.data.access_token,
            refreshToken: res.data.refresh_token,
            created: true,
            phone,
            message: 'Account created and signed in.',
          }),
        );
      }
    }

    if (action === 'signup') {
      const requestId = String(body.requestId || '').trim();
      const otp = String(body.otp || '').trim();
      if (!email || !password || !phone || !requestId || !otp) {
        return withCors(
          request,
          NextResponse.json(
            {
              ok: false,
              error: 'Email, password, phone, OTP, and requestId are required.',
            },
            { status: 400 },
          ),
        );
      }
      // Prove phone ownership first.
      await verifyOtp({ request_id: requestId, otp_code: otp });
      try {
        await register({
          username: email.split('@')[0] || email,
          email,
          password,
        });
      } catch {
        // may already exist — continue to login
      }
      const res = await login({ username: email, password });
      return withCors(
        request,
        NextResponse.json({
          ok: true,
          accessToken: res.data.access_token,
          refreshToken: res.data.refresh_token,
          created: true,
          message: 'Account ready with verified phone.',
        }),
      );
    }

    if (action === 'reset_request') {
      if (!email) {
        return withCors(
          request,
          NextResponse.json(
            { ok: false, error: 'Email is required.' },
            { status: 400 },
          ),
        );
      }
      try {
        await passwordResetRequest({ email });
      } catch (e) {
        console.warn('[app/account] reset request', e);
      }
      return withCors(
        request,
        NextResponse.json({
          ok: true,
          message:
            'If that email exists, a password reset message was sent. You can also use the website Reset page.',
        }),
      );
    }

    return withCors(
      request,
      NextResponse.json({ ok: false, error: 'Unknown action.' }, { status: 400 }),
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Account action failed';
    return withCors(
      request,
      NextResponse.json({ ok: false, error: msg }, { status: 400 }),
    );
  }
}

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}
