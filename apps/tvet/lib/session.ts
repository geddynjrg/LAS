"use server";

import { cookies } from "next/headers";

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

export async function updateSession(accessToken: string, expiresAt: number) {
  const cookie = await getSession();

  if (!cookie) {
    return null;
  }

  const cookieStore = await cookies();
  cookieStore.set("session", accessToken, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const cookie = (await cookies()).get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  return cookie;
}

export async function deleteSession() {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
}
