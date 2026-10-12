import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { z } from 'zod';

async function otpRequestHeaders(): Promise<Record<string, string>> {
  const out: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (process.env.EXTERNAL_API_KEY) {
    out['X-API-Key'] = process.env.EXTERNAL_API_KEY;
  }
  try {
    const h = await headers();
    const raw =
      h.get('x-forwarded-for') ||
      h.get('x-real-ip') ||
      h.get('cf-connecting-ip') ||
      '';
    const ip = raw.split(',')[0]?.trim();
    if (ip) {
      out['X-Forwarded-For'] = ip;
      out['X-Real-IP'] = ip;
    }
  } catch {
    // Not in a request context (scripts/tests).
  }
  return out;
}

const OtpRequestResponseSchema = z.object({
  success: z.boolean(),
  request_id: z.string().optional(),
  message: z.string().optional(),
  expires_in: z.number().optional(),
  phone_number: z.string().optional(),
  delivery_channel: z.enum(['sms', 'email', 'app']).optional(),
  masked_email: z.string().optional(),
  need_email: z.boolean().optional(),
  error: z.string().optional(),
});

export type OtpRequestResult = z.infer<typeof OtpRequestResponseSchema> & {
  request_id: string;
  message: string;
  expires_in: number;
  delivery_channel?: 'sms' | 'email' | 'app';
  masked_email?: string;
};

export class OtpNeedEmailError extends Error {
  needEmail = true as const;

  constructor(message: string) {
    super(message);
    this.name = 'OtpNeedEmailError';
  }
}

export async function requestOtp(data: { phone: string; email?: string }) {
  const t = await getTranslations('LoginPage');

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('API_URL environment variable is required');
  }
  const OTP_REQUEST = `${apiUrl.replace(/\/$/, '')}/api/auth/otp/request`;

  const body: Record<string, string> = {
    phone_number: data.phone,
  };
  if (data.email?.trim()) {
    body.email = data.email.trim();
  }

  let response: Response;

  if (process.env.NODE_ENV === 'development') {
    const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    try {
      response = await fetch(OTP_REQUEST, {
        method: 'POST',
        headers: await otpRequestHeaders(),
        body: JSON.stringify(body),
      });
    } finally {
      if (originalValue !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }
  } else {
    response = await fetch(OTP_REQUEST, {
      method: 'POST',
      headers: await otpRequestHeaders(),
      body: JSON.stringify(body),
    });
  }

  let responseData: z.infer<typeof OtpRequestResponseSchema> = {
    success: false,
  };
  try {
    responseData = (await response.json()) as z.infer<
      typeof OtpRequestResponseSchema
    >;
  } catch {
    // Response body may be empty or non-JSON.
  }

  if (!response.ok || responseData.success === false) {
    const apiError = String(
      responseData.error || responseData.message || '',
    ).trim();

    if (
      responseData.need_email ||
      /provide the email|need.?email/i.test(apiError)
    ) {
      throw new OtpNeedEmailError(
        apiError ||
          'SMS unavailable. Enter the email linked to this phone, open the Uwezo Fund app if signed in, or use eCitizen / password login.',
      );
    }

    if (response.status === 429 || /too many requests/i.test(apiError)) {
      throw new Error(t('tooManyOtpRequests'));
    }

    if (
      /sms|email|provider|configured|delivery|send|unavailable/i.test(
        apiError,
      ) ||
      response.status >= 500
    ) {
      throw new Error(
        apiError && apiError.length < 180 ? apiError : t('otpDeliveryFailed'),
      );
    }

    if (
      response.status === 400 &&
      (/phone/i.test(apiError) || /required/i.test(apiError) || !apiError)
    ) {
      throw new Error(t('invalidPhoneFormat'));
    }

    throw new Error(
      apiError && !apiError.startsWith('{') ? apiError : t('otpRequestFailed'),
    );
  }

  const validation = OtpRequestResponseSchema.safeParse(responseData);
  if (!validation.success) {
    console.warn(
      '[OTP Request] Response Schema Error:',
      validation.error.toString(),
    );
  }

  if (!responseData.request_id) {
    throw new Error(t('otpRequestFailed'));
  }

  return {
    success: true,
    request_id: responseData.request_id,
    message:
      responseData.message ||
      (responseData.delivery_channel === 'email'
        ? t('otpSentEmail')
        : responseData.delivery_channel === 'app'
          ? t('otpSentApp')
          : t('otpSent')),
    expires_in: responseData.expires_in ?? 300,
    delivery_channel: responseData.delivery_channel,
    masked_email: responseData.masked_email,
    phone_number: responseData.phone_number,
  } satisfies OtpRequestResult;
}
