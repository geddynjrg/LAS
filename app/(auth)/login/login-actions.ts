// app/(auth)/login/login-actions.ts
'use server';

import {
  type ECitizenLogin,
  type EmailLogin,
  type PhoneLogin,
  createEmailLoginSchema,
  createPhoneLoginSchema,
  ecitizenLoginSchema,
} from '@/app/(auth)/login/login-schema';
import { login, loginWithECitizen } from '@/lib/api/login';
import { requestOtp } from '@/lib/api/otp-request';
import { verifyOtp } from '@/lib/api/otp-verify';
import { createSession } from '@/lib/session';
import { formatKenyanPhoneForApi } from '@/lib/utils/string';
import type { FormAction } from '@workspace/ui/hooks/use-form';
import { getFormZodDataValues } from '@workspace/ui/lib/utils';
import { getTranslations } from 'next-intl/server';

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

// app/(auth)/login/login-actions.ts

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
        otpRequestId: otpResponse.request_id,
      };
    } else {
      // Step 2: Verify OTP
      const res = await verifyOtp({
        request_id: data.request_id!,
        otp_code: data.otp_code!,
      });

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

  console.log('🔍 eCitizen Login Action - Input:', { data, success, error });

  if (error) {
    console.log('❌ eCitizen Login Action - Validation error:', error);
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    // Handle OAuth callback processing
    if (data.code && data.state && data.code_verifier) {
      console.log('🔍 eCitizen Login Action - Processing callback...');

      // Step 2: Process OAuth callback
      const response = await fetch(
        'http://localhost:8000/index.php?process_callback=true',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: data.code,
            state: data.state,
            code_verifier: data.code_verifier,
          }),
        },
      );

      console.log('🔍 PHP Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ PHP Error:', errorData);
        throw new Error(errorData.error || 'Authentication failed');
      }

      const result = await response.json();
      console.log('🔍 PHP Result:', result);

      if (result.success && result.user_data) {
        console.log('🔍 Authenticating with backend...');

        // Authenticate with your backend using eCitizen user data
        const authResult = await loginWithECitizen(result.user_data);
        console.log('🔍 Backend auth result:', authResult);

        await createSession({
          accessToken: authResult.data.access_token,
          refreshToken: authResult.data.refresh_token,
        });

        console.log('✅ Session created successfully');
        return { success: true };
      } else {
        console.error('❌ PHP returned failure:', result);
        throw new Error(result.error || 'Authentication failed');
      }
    } else {
      // Step 1: Initiate OAuth flow
      console.log('🔍 eCitizen Login Action - Initiating OAuth');
      return {
        success: true,
        message: 'Redirecting to eCitizen...',
      };
    }
  } catch (error) {
    console.error('❌ eCitizen Login Action - Error:', error);
    return {
      success: false,
      errors: {},
      message: error instanceof Error ? error.message : t('unknownError'),
      values,
    };
  }
};
