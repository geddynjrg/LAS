"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, type FC } from "react";

import { Alert } from "@workspace/ui/components/alert";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";
import { useMount } from "@workspace/ui/hooks/use-mount";

import { loginSchema, type Login } from "@/app/(auth)/login/login-schema";
import { useSession } from "@/hooks/useSession";

export interface LoginFormProps {
  action: FormAction<Login>;
  redirectTo?: string;
}

export const LoginForm: FC<LoginFormProps> = ({ action, redirectTo }) => {
  const t = useTranslations("LoginPage");
  const router = useRouter();
  const { setSession } = useSession();
  const [state, formAction, isPending] = useForm(action, loginSchema);

  // reset ui session
  useMount(() => {
    setSession(null);
  });

  // set new session on login
  useEffect(() => {
    if (state.success) {
      setSession(true);
      router.replace(redirectTo ?? "/dashboard");
    }
  }, [redirectTo, router, setSession, state.success]);

  return (
    <Form action={formAction} className="space-y-6" autoComplete="on">
      {state.message && (
        <Alert variant="error" className="mb-4">
          {state.message}
        </Alert>
      )}

      <Field
        state={state}
        name="email"
        label={t("email")}
        required
        control={(props) => <Input placeholder="email@email.com" {...props} />}
      />

      <Field
        state={state}
        name="password"
        label={t("password")}
        required
        control={(props) => (
          <Input
            type="password"
            placeholder="••••••••••••••••••••"
            {...props}
          />
        )}
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
