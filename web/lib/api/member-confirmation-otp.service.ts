'use server';

import { updateSession } from '@/lib/session';

export interface OtpActionResponse {
  success: boolean;
  message?: string;
  expires_in?: number;
  attempts_remaining?: number;
  already_responded?: boolean;
  member?: {
    national_id_code?: string;
    confirmation_status?: string;
  };
}

async function postMemberConfirmationOtp(
  applicationId: string,
  body: Record<string, string>,
): Promise<OtpActionResponse> {
  const accessToken = await updateSession();

  if (!accessToken) {
    return {
      success: false,
      message: 'Your session has expired. Please log out and log in again, then retry sending the OTP.',
    };
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return {
      success: false,
      message: 'API URL is not configured.',
    };
  }

  const response = await fetch(
    `${apiUrl.replace(/\/$/, '')}/api/v1/application/${encodeURIComponent(applicationId)}/member-confirmation/otp`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(process.env.EXTERNAL_API_KEY
          ? { 'X-API-Key': process.env.EXTERNAL_API_KEY }
          : {}),
      },
      body: JSON.stringify(body),
    },
  );

  const payload = (await response.json()) as OtpActionResponse;

  if (!response.ok && payload.success !== true) {
    return {
      success: false,
      message: payload.message || `Request failed with status ${response.status}`,
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
