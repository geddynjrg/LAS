'use client';

import {
  type PhoneLogin,
  phoneLoginSchema,
} from '@/app/(auth)/login/login-schema';
import { resolveReturnPath } from '@/lib/return-path';
import { normalizeKenyanPhoneLocal } from '@/lib/utils/string';
import { Alert } from '@workspace/ui/components/alert';
import { Field, Form, SubmitButton } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { labelVariants } from '@workspace/ui/components/label';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import { type FC, useEffect, useId, useState } from 'react';

type PhoneLoginState = 'phone_input' | 'otp_input';

export interface PhoneLoginFormProps {
  action: FormAction<PhoneLogin>;
  redirectTo?: string;
}

export const PhoneLoginForm: FC<PhoneLoginFormProps> = ({
  action,
  redirectTo,
}) => {
  const t = useTranslations('LoginPage');
  const phoneInputId = useId();
  const phoneErrorId = `${phoneInputId}-error`;
  const [phoneLoginState, setPhoneLoginState] =
    useState<PhoneLoginState>('phone_input');
  const [otpRequestId, setOtpRequestId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [redirectTarget, setRedirectTarget] = useState(
    redirectTo ?? '/dashboard',
  );
  const [state, formAction, isPending] = useForm(
    action,
    phoneLoginSchema,
    {},
    (formData) => {
      if (phoneNumber) {
        formData.set('phone', phoneNumber);
      }
    },
  );

  useEffect(() => {
    const initial =
      (state.values as { phone?: string } | undefined)?.phone ?? '';
    if (!initial) return;
    const normalized =
      normalizeKenyanPhoneLocal(initial) ?? initial.replace(/\D/g, '');
    setPhoneNumber(normalized);
  }, [state.values]);

  useEffect(() => {
    setRedirectTarget(resolveReturnPath(redirectTo));
  }, [redirectTo]);

  // Hardcoded to Kenya until multi-country support is needed
  const COUNTRY_CODE = '+254';

  const handlePhoneChange = (value: string) => {
    const normalized = normalizeKenyanPhoneLocal(value);
    setPhoneNumber(normalized ?? value.replace(/\D/g, ''));
  };

  const handlePhoneBlur = () => {
    const normalized = normalizeKenyanPhoneLocal(phoneNumber);
    if (normalized) {
      setPhoneNumber(normalized);
    }
  };

  // Navigate on successful final login completion (not OTP request)
  useEffect(() => {
    const stateWithOtp = state as typeof state & { otpRequestId?: string };
    if (state.success && !stateWithOtp.otpRequestId) {
      // Only redirect if success is true AND we don't have an OTP request ID
      // (meaning this is final login, not just OTP sent)
      // Hard navigation to ensure cookies are properly read
      window.location.href = redirectTarget;
    }
  }, [redirectTarget, state.success, state]);

  // handle OTP request ID from server response
  useEffect(() => {
    const stateWithOtp = state as typeof state & { otpRequestId?: string };
    if (stateWithOtp.otpRequestId) {
      setOtpRequestId(stateWithOtp.otpRequestId);
      setPhoneLoginState('otp_input');
    }
  }, [state]);

  const phoneFieldError = state.errors?.phone?.[0];
  const phoneErrorMessage =
    typeof phoneFieldError === 'string'
      ? phoneFieldError
      : phoneFieldError?.message;

  return (
    <Form action={formAction} className="space-y-6" autoComplete="on">
      {state.message && (
        <Alert variant={state.success ? 'success' : 'error'} className="mb-4">
          {state.message}
        </Alert>
      )}

      {/* Phone Input - Step 1 */}
      {phoneLoginState === 'phone_input' && (
        <>
          <div className="flex w-full flex-col gap-1">
            <label
              htmlFor={phoneInputId}
              className={cn(labelVariants(), 'mb-1 font-bold')}
            >
              {t('phoneNumber')}
              <span className="text-destructive">*</span>
            </label>
            <Input
              id={phoneInputId}
              name="phone"
              type="tel"
              startDecorator={COUNTRY_CODE}
              placeholder="712345678"
              autoComplete="tel-national"
              maxLength={10}
              value={phoneNumber}
              onValueChange={handlePhoneChange}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={handlePhoneBlur}
              aria-required="true"
              aria-invalid={phoneErrorMessage ? 'true' : 'false'}
              aria-describedby={phoneErrorMessage ? phoneErrorId : undefined}
            />
            {phoneErrorMessage && (
              <p
                id={phoneErrorId}
                className="text-destructive typo-body-small"
                role="alert"
                aria-live="polite"
              >
                {phoneErrorMessage}
              </p>
            )}
          </div>
        </>
      )}

      {/* OTP Input - Step 2 */}
      {phoneLoginState === 'otp_input' && (
        <>
          <div className="space-y-2">
            <p className="typo-body-medium text-neutral-600">
              {t('enterOtpSentTo', {
                phoneNumber: `${COUNTRY_CODE}${phoneNumber}`,
              })}
            </p>
            <Field
              state={state}
              name="otp_code"
              label={t('otpCode')}
              required
              control={(props) => (
                <Input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  {...props}
                />
              )}
            />
          </div>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                setPhoneLoginState('phone_input');
                setOtpRequestId('');
              }}
              className="text-primary typo-body-medium cursor-pointer border-0 bg-transparent p-0 underline"
            >
              {t('changePhoneNumber')}
            </button>
          </div>
        </>
      )}

      {/* Hidden fields for OTP flow */}
      <input type="hidden" name="loginType" value="phone" />
      {otpRequestId && (
        <input type="hidden" name="request_id" value={otpRequestId} />
      )}

      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      <SubmitButton className="w-full" disabled={isPending}>
        {phoneLoginState === 'phone_input' ? t('sendOtp') : t('login')}
      </SubmitButton>
    </Form>
  );
};
