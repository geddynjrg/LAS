"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, type FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { loginAction } from "@/app/(auth)/login/username/login-action";
import { loginSchema } from "@/app/(auth)/login/username/login-schema";
import { useSession } from "@/hooks/useSession";

export interface LoginFormProps {
  redirectTo?: string;
}

export const LoginForm: FC<LoginFormProps> = ({ redirectTo }) => {
  const t = useTranslations("LoginPage");
  const { setSession } = useSession();
  const router = useRouter();
  const [state, formAction, isPending] = useForm(loginAction, loginSchema);

  // update session on login
  useEffect(() => {
    if (state.success) {
      setSession(true);
      router.push(redirectTo ?? "/dashboard");
    }
  }, [state.success]);

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
        name="password"
        label={t("password")}
        required
        control={(props) => <Input type="password" {...props} />}
      />

      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      <SubmitButton className="w-full" disabled={isPending}>
        {t("login")}
      </SubmitButton>
    </Form>
  );
};
