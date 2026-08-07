import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

const OtpRequestResponseSchema = z.object({
  success: z.boolean(),
  request_id: z.string(),
  message: z.string(),
  expires_in: z.number(),
  phone_number: z.string().optional(),
});

export async function requestOtp(data: { phone: string }) {
  const t = await getTranslations('LoginPage');

  // Use direct fetch to avoid authentication headers for login endpoints
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('API_URL environment variable is required');
  }
  const OTP_REQUEST = `${apiUrl.replace(/\/$/, '')}/api/auth/otp/request`;

  let response: Response;

  if (process.env.NODE_ENV === 'development') {
    // In development, temporarily set the environment variable for this specific request
    const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    try {
      response = await fetch(OTP_REQUEST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: data.phone,
        }),
      });
    } finally {
      // Restore the original value
      if (originalValue !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }
  } else {
    response = await fetch(OTP_REQUEST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: data.phone,
      }),
    });
  }

  if (!response.ok) {
    let apiError = '';
    try {
      const errorBody = (await response.json()) as {
        error?: string;
        message?: string;
      };
      apiError = String(errorBody.error || errorBody.message || '').trim();
    } catch {
      // Response body may be empty or non-JSON.
    }

    if (response.status === 429) {
      throw new Error(t('tooManyOtpRequests'));
    }

    // SMS / provider failures must not look like a phone validation error.
    if (
      /sms|provider|configured|delivery|send/i.test(apiError) ||
      response.status >= 500
    ) {
      throw new Error(t('otpDeliveryFailed'));
    }

    if (
      response.status === 400 &&
      (/phone/i.test(apiError) || /required/i.test(apiError) || !apiError)
    ) {
      throw new Error(t('invalidPhoneFormat'));
    }

    throw new Error(t('otpRequestFailed'));
  }

  const responseData = await response.json();
  const validation = OtpRequestResponseSchema.safeParse(responseData);

  if (!validation.success) {
    console.warn(
      '[OTP Request] Response Schema Error:',
      validation.error.toString(),
      responseData,
    );
  }

  return responseData as z.infer<typeof OtpRequestResponseSchema>;
}
