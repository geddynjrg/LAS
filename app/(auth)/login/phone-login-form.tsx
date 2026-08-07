'use client';

import {
  type PhoneLogin,
  phoneLoginSchema,
} from '@/app/(auth)/login/login-schema';
import {
  normalizeKenyanPhoneLocal,
  resolveKenyanPhoneForSubmit,
} from '@/lib/utils/string';
import { Alert } from '@workspace/ui/components/alert';
import { Field, Form, SubmitButton } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { labelVariants } from '@workspace/ui/components/label';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import {
  type FC,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';

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
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const latestPhoneRef = useRef('');
  const [phoneLoginState, setPhoneLoginState] =
    useState<PhoneLoginState>('phone_input');
  const [otpRequestId, setOtpRequestId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  const syncPhoneToFormData = useCallback(
    (formData: FormData) => {
      const domValue = phoneInputRef.current?.value;
      if (domValue != null) {
        const fromDom =
          normalizeKenyanPhoneLocal(domValue) ?? domValue.replace(/\D/g, '');
        latestPhoneRef.current = fromDom;
      }

      const resolved = resolveKenyanPhoneForSubmit(
        phoneInputRef.current?.value,
        latestPhoneRef.current,
        phoneNumber,
        formData.get('phone')?.toString(),
      );
      if (resolved) {
        formData.set('phone', resolved);
      } else {
        formData.delete('phone');
      }
    },
    [phoneNumber],
  );

  const [state, formAction, isPending] = useForm(
    action,
    phoneLoginSchema,
    {},
    syncPhoneToFormData,
  );

  useEffect(() => {
    const initial =
      (state.values as { phone?: string } | undefined)?.phone ?? '';
    if (!initial) return;
    const normalized =
      normalizeKenyanPhoneLocal(initial) ?? initial.replace(/\D/g, '');
    latestPhoneRef.current = normalized;
    setPhoneNumber(normalized);
  }, [state.values]);

  const COUNTRY_CODE = '+254';

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const normalized = normalizeKenyanPhoneLocal(value) ?? digits;
    latestPhoneRef.current = normalized;
    flushSync(() => {
      setPhoneNumber(normalized);
    });
  };

  const handlePhoneBlur = () => {
    const normalized = normalizeKenyanPhoneLocal(
      phoneInputRef.current?.value ?? phoneNumber,
    );
    if (normalized) {
      latestPhoneRef.current = normalized;
      setPhoneNumber(normalized);
    }
  };

  useEffect(() => {
    const stateWithOtp = state as typeof state & { otpRequestId?: string };
    if (state.success && !stateWithOtp.otpRequestId) {
      window.location.href = redirectTo ?? '/dashboard';
    }
  }, [redirectTo, state.success, state]);

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

      {phoneLoginState === 'phone_input' && (
        <div className="flex w-full flex-col gap-1">
          <label
            htmlFor={phoneInputId}
            className={cn(labelVariants(), 'mb-1 font-bold')}
          >
            {t('phoneNumber')}
            <span className="text-destructive">*</span>
          </label>
          <Input
            ref={phoneInputRef}
            id={phoneInputId}
            type="tel"
            inputMode="numeric"
            startDecorator={COUNTRY_CODE}
            placeholder="712345678"
            autoComplete="tel-national"
            maxLength={10}
            value={phoneNumber}
            onValueChange={handlePhoneChange}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onInput={(e) => handlePhoneChange(e.currentTarget.value)}
            onBlur={handlePhoneBlur}
            aria-required="true"
            aria-invalid={phoneErrorMessage ? 'true' : 'false'}
            aria-describedby={phoneErrorMessage ? phoneErrorId : undefined}
          />
          <input type="hidden" name="phone" value={phoneNumber} />
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
      )}

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
