"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, type FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { signupAction } from "@/app/(auth)/signup/signup-action";
import { signupSchema } from "@/app/(auth)/signup/signup-schema";
import { useSession } from "@/hooks/useSession";

export interface SignupFormProps {
  redirectTo?: string;
}

export const SignupForm: FC<SignupFormProps> = ({ redirectTo }) => {
  const t = useTranslations("SignUpPage");
  const { setSession } = useSession();
  const { replace } = useRouter();
  const [state, formAction, isPending] = useForm(signupAction, signupSchema);

  // update session after signup
  useEffect(() => {
    if (state.success) {
      setSession(true);
      replace(redirectTo ?? "/dashboard");
    }
  }, [redirectTo, replace, setSession, state.success]);

  return (
    <Form action={formAction} className="space-y-6" autoComplete="on">
      {state.message && (
        <Alert variant="error" className="mb-4">
          {state.message}
        </Alert>
      )}

      <Field
        state={state}
        name="username"
        label={t("username")}
        required
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="email"
        label={t("email")}
        required
        control={(props) => <Input {...props} />}
      />

      <Field
        state={state}
        name="password"
        label={t("password")}
        required
        control={(props) => <Input type="password" {...props} />}
      />

      <Field
        state={state}
        name="passwordConfirm"
        label={t("passwordConfirm")}
        required
        control={(props) => <Input type="password" {...props} />}
      />

      <SubmitButton className="w-full" disabled={isPending}>
        {t("signUp")}
      </SubmitButton>
    </Form>
  );
};
