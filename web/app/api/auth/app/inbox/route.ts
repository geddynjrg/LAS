import { optionsCors, withCors } from '@/lib/auth/cors-app';
import { listInbox } from '@/lib/push/app-push';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Poll in-app notification inbox (works even without FCM keys). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const phone = url.searchParams.get('phone') || undefined;
  const email = url.searchParams.get('email') || undefined;
  const userId = url.searchParams.get('userId') || undefined;
  const items = listInbox({ phone, email, userId })
    .slice(0, 20)
    .map((m) => ({
      id: m.id,
      title: m.title,
      body: m.body,
      kind: m.kind,
      createdAt: new Date(m.createdAt).toISOString(),
      meta: m.meta,
    }));
  return withCors(
    request,
    NextResponse.json({
      ok: true,
      items,
    }),
  );
}

export async function OPTIONS(request: Request) {
  return optionsCors(request);
}
