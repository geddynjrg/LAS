'use server';

import { forceRefreshSession, updateSession } from '@/lib/session';

export interface OtpActionResponse {
  success: boolean;
  message?: string;
  expires_in?: number;
  attempts_remaining?: number;
  already_responded?: boolean;
  needReauth?: boolean;
  member?: {
    national_id_code?: string;
    confirmation_status?: string;
  };
}

function isJwtAuthFailure(
  message: string | undefined,
  status: number,
): boolean {
  if (status === 401 || status === 403) return true;
  const m = String(message || '').toLowerCase();
  return (
    m.includes('invalid or expired jwt') ||
    m.includes('jwt token') ||
    m.includes('unauthenticated') ||
    m.includes('access denied') ||
    m.includes('token expired')
  );
}

async function callOtpEndpoint(
  applicationId: string,
  accessToken: string,
  body: Record<string, string>,
): Promise<{ status: number; payload: OtpActionResponse }> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return {
      status: 500,
      payload: { success: false, message: 'API URL is not configured.' },
    };
  }

  const response = await fetch(
    `${apiUrl.replace(/\/$/, '')}/api/v1/application/${encodeURIComponent(applicationId)}/member-confirmation/otp?_format=json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(process.env.EXTERNAL_API_KEY
          ? { 'X-API-Key': process.env.EXTERNAL_API_KEY }
          : {}),
      },
      body: JSON.stringify(body),
    },
  );

  let payload: OtpActionResponse = { success: false };
  try {
    payload = (await response.json()) as OtpActionResponse;
  } catch {
    payload = {
      success: false,
      message: `OTP request failed with status ${response.status}. Please try again.`,
    };
  }

  return { status: response.status, payload };
}

async function postMemberConfirmationOtp(
  applicationId: string,
  body: Record<string, string>,
): Promise<OtpActionResponse> {
  let accessToken = await updateSession();

  if (!accessToken) {
    return {
      success: false,
      needReauth: true,
      message:
        'Your session has expired. Please log out and log in again, then tap Send OTP.',
    };
  }

  let { status, payload } = await callOtpEndpoint(
    applicationId,
    accessToken,
    body,
  );

  // Drupal sometimes rejects a cookie JWT that still looks valid locally —
  // force-refresh once and retry before asking the user to re-login.
  if (payload.success !== true && isJwtAuthFailure(payload.message, status)) {
    const refreshed = await forceRefreshSession();
    if (!refreshed) {
      return {
        success: false,
        needReauth: true,
        message:
          'Your login session expired. Please log out, sign in again, then return to this step and tap Send OTP.',
      };
    }
    accessToken = refreshed;
    ({ status, payload } = await callOtpEndpoint(
      applicationId,
      accessToken,
      body,
    ));
  }

  if (payload.success === true) {
    return payload;
  }

  if (isJwtAuthFailure(payload.message, status)) {
    return {
      success: false,
      needReauth: true,
      message:
        'Your login session is no longer valid for OTP. Please log out, sign in again, then tap Send OTP.',
    };
  }

  if (!status || status >= 400) {
    return {
      success: false,
      message:
        payload.message ||
        `Request failed with status ${status}. Please try again.`,
      attempts_remaining: payload.attempts_remaining,
    };
  }

  return payload;
}

export async function sendMemberConfirmationOtp(
  applicationId: string,
  nationalIdCode: string,
): Promise<OtpActionResponse> {
  return postMemberConfirmationOtp(applicationId, {
    action: 'send',
    national_id_code: nationalIdCode,
  });
}

export async function verifyMemberConfirmationOtp(
  applicationId: string,
  nationalIdCode: string,
  otpCode: string,
): Promise<OtpActionResponse> {
  return postMemberConfirmationOtp(applicationId, {
    action: 'verify',
    national_id_code: nationalIdCode,
    otp_code: otpCode,
  });
}
