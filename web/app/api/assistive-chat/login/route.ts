import { login } from '@/lib/api/login';
import { createSession, getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Chat login via Drupal LAS credentials API.
 * Sets httpOnly JWT cookies. Never logs passwords.
 */
export async function POST(request: Request) {
  let username = '';
  let password = '';
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };
    username = String(body.username || '').trim();
    password = String(body.password || '');
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON' },
      { status: 400 },
    );
  }

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: 'Username and password are required.' },
      { status: 400 },
    );
  }

  try {
    const res = await login({ username, password });
    await createSession({
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    });
    return NextResponse.json({
      ok: true,
      username,
      message: 'Signed in successfully.',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid email or password';
    return NextResponse.json({ ok: false, error: msg }, { status: 401 });
  }
}

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    authenticated: Boolean(session),
  });
}
