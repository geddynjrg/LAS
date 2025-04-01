"use server";

import { cookies } from "next/headers";

const REFRESH_TOKENS_URL = `${process.env.NEXT_API_URL}/api/v1/user/token/refresh`;
const LOGOUT_URL = `${process.env.NEXT_API_URL}/api/v1/user/logout`;

const ACCESS_TOKEN_COOKIE_NAME = "access-token";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";

export async function createSession(data: {
  accessToken: string;
  refreshToken: string;
}) {
  const cookieStore = await cookies();
  const now = Date.now();

  const refreshTokenExpiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000);

  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, data.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, data.refreshToken, {
    httpOnly: true,
    secure: true,
    expires: refreshTokenExpiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value;
}

export async function updateSession() {
  const { accessToken, refreshToken } = await getStoredTokens();

  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken; // Token is valid
  }

  // cannot update session if refresh token is not set
  if (!refreshToken) {
    return null;
  }

  // access token is not set or is expired
  // try to refresh it using the refresh token
  const newTokens = await getNewTokens();

  // remove session if refreshing tokens fails
  if (!newTokens || isTokenExpired(newTokens.accessToken)) {
    deleteCookies();
    return null;
  }

  // create new session with the new tokens
  await createSession(newTokens);

  // return the new access token
  return newTokens.accessToken;
}

export async function invalidateSession() {
  const accessToken = await getSession();

  // invalidate token on the server
  await fetch(LOGOUT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // delete token from cookies
  await deleteCookies();
}

async function deleteCookies() {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
}

function isTokenExpired(token: unknown) {
  if (typeof token !== "string") {
    return true; // Invalid token type
  }

  try {
    const tokenPayloadBase64 = token.split(".")[1];

    if (!tokenPayloadBase64) {
      return true; // invalid token format
    }

    const exp: number = JSON.parse(atob(tokenPayloadBase64))?.exp ?? 0;

    return Date.now() > exp * 1000;
  } catch (_err) {
    return true; // if the token is invalid, consider it expired
  }
}

async function getStoredTokens() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  return { accessToken, refreshToken };
}

async function getNewTokens() {
  const cookieStore = await cookies();
  const currentRefreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  const res = await fetch(REFRESH_TOKENS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: currentRefreshToken }),
  });

  if (!res.ok) {
    console.warn(
      "[Session] Failed to refresh tokens:",
      res.status,
      res.statusText,
    );

    return null;
  }

  const resJson = await res.json();

  const accessToken = resJson?.data?.access_token;
  const refreshToken = resJson?.data?.refresh_token;

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    console.warn("[Session] Invalid tokens:", resJson);
    return null;
  }

  return { accessToken, refreshToken };
}
