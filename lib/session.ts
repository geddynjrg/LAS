// lib/session.ts

'use server';

import { cookies } from 'next/headers';

import { decodeJwtPayload } from './jwt-utils';

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

// lib/session.ts

const REFRESH_TOKENS_URL = `${process.env.API_URL}/api/v1/user/token/refresh`;
const LOGOUT_URL = `${process.env.API_URL}/api/v1/user/logout`;

const ACCESS_TOKEN_COOKIE_NAME = 'access-token';
const REFRESH_TOKEN_COOKIE_NAME = 'refresh-token';

// Helper: detect eCitizen fake tokens
const isECitizenToken = (token: string | undefined): boolean => {
  return typeof token === 'string' && token.startsWith('ecitizen|');
};

// Check if a real JWT is expired
function isTokenExpired(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return true;

  // eCitizen tokens never expire
  if (isECitizenToken(token)) return false;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  return Date.now() > payload.exp * 1000;
}

// Get stored tokens
async function getStoredTokens() {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value,
  };
}

// Refresh real tokens (skip for eCitizen)
async function getNewTokens() {
  const { refreshToken } = await getStoredTokens();

  if (!refreshToken || isECitizenToken(refreshToken)) {
    return null;
  }

  const res = await fetch(REFRESH_TOKENS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    console.warn('[Session] Failed to refresh tokens:', res.status);
    return null;
  }

  const json = await res.json();
  const accessToken = json?.data?.access_token;
  const refreshTokenNew = json?.data?.refresh_token;

  if (typeof accessToken !== 'string' || typeof refreshTokenNew !== 'string') {
    return null;
  }

  return { accessToken, refreshToken: refreshTokenNew };
}

// Delete all session cookies
async function deleteCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
  cookieStore.delete('ecitizen_authenticated');
}

// Create session (called after login)
export async function createSession(data: {
  accessToken: string;
  refreshToken: string;
}) {
  // eCitizen session is already created in the Route Handler
  if (data.accessToken.startsWith('ecitizen|')) {
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  if (isECitizenToken(data.accessToken)) {
    cookieStore.set('ecitizen_authenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

// Get raw access token
export async function getSession() {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value;
}

// Used by middleware — returns valid token or null
export async function updateSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const isECitizen =
    cookieStore.get('ecitizen_authenticated')?.value === 'true';

  // THIS IS THE WINNING LINE
  if (isECitizen && accessToken?.startsWith('ecitizen|')) {
    return accessToken; // ← middleware accepts this and lets you in
  }

  // Normal JWT flow
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  if (!refreshToken) return null;

  const newTokens = await getNewTokens();
  if (!newTokens || isTokenExpired(newTokens.accessToken)) {
    await deleteCookies();
    return null;
  }

  await createSession(newTokens);
  return newTokens.accessToken;
}

// Logout
export async function invalidateSession() {
  const accessToken = await getSession();

  if (accessToken && !isECitizenToken(accessToken)) {
    try {
      await fetch(LOGOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.warn('[Session] Failed to logout on server:', error);
    }
  }

  await deleteCookies();
}
