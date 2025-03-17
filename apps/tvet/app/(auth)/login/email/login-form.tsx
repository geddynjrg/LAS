"use client";

import { useTranslations } from "next-intl";
import type { FC } from "react";
import { z } from "zod";

import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";

const loginSchema = z.object({
  email: z.string().nonempty().email(),
  password: z.string().nonempty(),
});

export type Login = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  action: FormAction<Login>;
  redirectTo?: string;
}

export const LoginForm: FC<LoginFormProps> = ({ action, redirectTo }) => {
  const t = useTranslations("LoginPage");
  const [state, formAction, isPending] = useForm(action, loginSchema);

  return (
    <Form action={formAction} className="space-y-6" autoComplete="on">
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
