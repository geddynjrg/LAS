// app/api/auth/ecitizen/internal-callback/route.ts
import { createSession } from '@/lib/session';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.ECITIZEN_INTERNAL_SECRET!;

export async function GET(request: NextRequest) {
  if (!SECRET) return new Response('Missing secret', { status: 500 });

  // THIS IS THE KEY: Use request.url directly (raw, un-decoded)
  const rawUrl = request.url;
  const url = new URL(rawUrl);

  const uid = url.searchParams.get('uid');
  const emailParam = url.searchParams.get('email'); // This is decoded!
  const sig = url.searchParams.get('sig');

  if (!uid || !emailParam || !sig) {
    return new Response('Missing params', { status: 400 });
  }

  // RECONSTRUCT THE EXACT RAW QUERY STRING PART
  // This matches exactly what PHP built
  const stringToSign = `uid=${uid}&email=${encodeURIComponent(emailParam)}`;

  const expectedSig = crypto
    .createHmac('sha256', SECRET)
    .update(stringToSign)
    .digest('hex');

  console.log('String to sign:', stringToSign);
  console.log('Received sig :', sig);
  console.log('Expected sig :', expectedSig);

  if (sig !== expectedSig) {
    return new Response('Invalid signature', { status: 401 });
  }

  const response = NextResponse.redirect(
    new URL('/dashboard', request.url),
    303,
  );

  response.cookies.set('access-token', `ecitizen|${uid}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.set('refresh-token', `ecitizen|${uid}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.set('ecitizen_authenticated', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  const fallbackName = emailParam;
  response.cookies.set('user_display_name', fallbackName, {
    httpOnly: false, // Must be readable by client
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
