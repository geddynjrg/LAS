import { optionsCors, withCors } from '@/lib/auth/cors-app';
import { registerPushDevice, pushEnvDocs } from '@/lib/push/app-push';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

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

  try {
    registerPushDevice({
      token: String(body.deviceToken || body.token || ''),
      platform: String(body.platform || 'android'),
      email: body.email ? String(body.email) : undefined,
      phone: body.phone ? String(body.phone) : undefined,
      userId: body.userId ? String(body.userId) : undefined,
    });
    return withCors(
      request,
      NextResponse.json({
        ok: true,
        message: 'Device registered for app notifications.',
        env: pushEnvDocs(),
      }),
    );
  } catch (e) {
    return withCors(
      request,
      NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : 'Register failed' },
        { status: 400 },
      ),
    );
  }
}

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}
