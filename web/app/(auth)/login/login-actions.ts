'use server';

import {
  type ECitizenLogin,
  type EmailLogin,
  type PhoneLogin,
  createEmailLoginSchema,
  createPhoneLoginSchema,
  ecitizenLoginSchema,
} from '@/app/(auth)/login/login-schema';
import { login } from '@/lib/api/login';
import { requestOtp } from '@/lib/api/otp-request';
import { verifyOtp } from '@/lib/api/otp-verify';
import { createSession } from '@/lib/session';
import { formatKenyanPhoneForApi } from '@/lib/utils/string';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { getFormZodDataValues } from '@workspace/ui/lib/utils';
import { getTranslations } from 'next-intl/server';

export const emailLoginAction: FormAction<EmailLogin> = async (
  _prev,
  formData,
) => {
  const t = await getTranslations('LoginPage');
  const emailLoginSchema = createEmailLoginSchema((key: string) =>
    t(key as Parameters<typeof t>[0]),
  );
  const values = getFormZodDataValues(formData, emailLoginSchema);
  const { data, success, error } = emailLoginSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const res = await login({
      username: data.email,
      password: data.password,
    });

    if (!res.data?.access_token || !res.data?.refresh_token) {
      return {
        success: false,
        errors: {},
        message: t('unknownError'),
        values,
      };
    }

    await createSession({
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      errors: {},
      message: error instanceof Error ? error.message : t('unknownError'),
      values,
    };
  }
};

export const phoneLoginAction: FormAction<PhoneLogin> = async (
  _prev,
  formData,
) => {
  const t = await getTranslations('LoginPage');
  const phoneLoginSchema = createPhoneLoginSchema((key: string) =>
    t(key as Parameters<typeof t>[0]),
  );
  const values = getFormZodDataValues(formData, phoneLoginSchema);
  const { data, success, error } = phoneLoginSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    // Two-step OTP flow
    if (!data.otp_code) {
      // Step 1: Request OTP — normalize to +254XXXXXXXXX for Drupal API
      const fullPhoneNumber = formatKenyanPhoneForApi(data.phone!);
      if (!fullPhoneNumber) {
        return {
          success: false,
          errors: { phone: [t('invalidPhoneFormat')] },
          values,
        };
      }
      const otpResponse = await requestOtp({ phone: fullPhoneNumber });

      return {
        success: true,
        message: t('otpSent'),
        values,
        // Custom field to trigger UI state change
        otpRequestId: otpResponse.request_id,
      };
    } else {
      // Step 2: Verify OTP
      const res = await verifyOtp({
        request_id: data.request_id!,
        otp_code: data.otp_code!,
      });

      if (!res.access_token || !res.refresh_token) {
        return {
          success: false,
          errors: {},
          message: t('unknownError'),
          values,
        };
      }

      await createSession({
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });

      return { success: true, otpRequestId: undefined };
    }
  } catch (error) {
    return {
      success: false,
      errors: {},
      message: error instanceof Error ? error.message : t('unknownError'),
      values,
    };
  }
};

export const ecitizenLoginAction: FormAction<ECitizenLogin> = async (
  _prev,
  formData,
) => {
  const t = await getTranslations('LoginPage');
  const values = getFormZodDataValues(formData, ecitizenLoginSchema);
  const { data, success, error } = ecitizenLoginSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    // This would typically handle the OAuth callback
    // For now, we'll just return success since the actual OAuth flow
    // happens client-side with the redirect
    return {
      success: true,
      message: 'Redirecting to eCitizen...',
    };
  } catch (error) {
    return {
      success: false,
      errors: {},
      message: error instanceof Error ? error.message : t('unknownError'),
      values,
    };
  }
};
