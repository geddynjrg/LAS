"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";
import { useMount } from "@workspace/ui/hooks/use-mount";

import {
  phoneLoginSchema,
  type PhoneLogin,
} from "@/app/(auth)/login/login-schema";
import { useSession } from "@/hooks/useSession";

type PhoneLoginState = "phone_input" | "otp_input";

export interface PhoneLoginFormProps {
  action: FormAction<PhoneLogin>;
  redirectTo?: string;
}

export const PhoneLoginForm: FC<PhoneLoginFormProps> = ({
  action,
  redirectTo,
}) => {
  const t = useTranslations("LoginPage");
  const router = useRouter();
  const { setSession } = useSession();
  const [state, formAction, isPending] = useForm(action, phoneLoginSchema);
  const [phoneLoginState, setPhoneLoginState] =
    useState<PhoneLoginState>("phone_input");
  const [otpRequestId, setOtpRequestId] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // Hardcoded to Kenya until multi-country support is needed
  const COUNTRY_CODE = "+254";

  // reset ui session
  useMount(() => {
    setSession(null);
  });

  // set new session on final login completion (not OTP request)
  useEffect(() => {
    const stateWithOtp = state as typeof state & { otpRequestId?: string };
    if (state.success && !stateWithOtp.otpRequestId) {
      // Only redirect if success is true AND we don't have an OTP request ID
      // (meaning this is final login, not just OTP sent)
      setSession(true);
      router.replace(redirectTo ?? "/dashboard");
    }
  }, [redirectTo, router, setSession, state.success, state]);

  // handle OTP request ID from server response
  useEffect(() => {
    const stateWithOtp = state as typeof state & { otpRequestId?: string };
    if (stateWithOtp.otpRequestId) {
      setOtpRequestId(stateWithOtp.otpRequestId);
      setPhoneLoginState("otp_input");
    }
  }, [state]);

  return (
    <Form action={formAction} className="space-y-6" autoComplete="on">
      {state.message && (
        <Alert
          variant={state.success ? "success" : "error"}
          className="mb-4"
        >
          {state.message}
        </Alert>
      )}


      {/* Phone Input - Step 1 */}
      {phoneLoginState === "phone_input" && (
        <Field
          state={state}
          name="phone"
          label={t("phoneNumber")}
          required
          control={(props) => (
            <Input
              type="tel"
              startDecorator={COUNTRY_CODE}
              placeholder="712345678"
              {...props}
              onValueChange={(value) => {
                setPhoneNumber(value);
              }}
            />
          )}
        />
      )}

      {/* OTP Input - Step 2 */}
      {phoneLoginState === "otp_input" && (
        <>
          <div className="space-y-2">
            <p className="typo-body-medium text-neutral-600">
              {t("enterOtpSentTo", {
                phoneNumber: `${COUNTRY_CODE}${phoneNumber}`,
              })}
            </p>
            <Field
              state={state}
              name="otp_code"
              label={t("otpCode")}
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
                setPhoneLoginState("phone_input");
                setOtpRequestId("");
              }}
              className="text-primary typo-body-medium cursor-pointer border-0 bg-transparent p-0 underline"
            >
              {t("changePhoneNumber")}
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
        {phoneLoginState === "phone_input" ? t("sendOtp") : t("login")}
      </SubmitButton>
    </Form>
  );
};