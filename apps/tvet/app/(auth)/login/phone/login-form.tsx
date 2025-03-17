"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC } from "react";
import { z } from "zod";

import { CallingCodeSelect } from "@workspace/ui/components/calling-code-select";
import {
  Field,
  FieldGroup,
  Form,
  SubmitButton,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";

const loginSchema = z.object({
  callingCode: z.string().nonempty(),
  phone: z.string().nonempty(),
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
      <FieldGroup label="Phone Number" required>
        <Field
          state={state}
          name="callingCode"
          className="max-w-40"
          required
          control={(props) => <CallingCodeSelect {...props} />}
        />
        <Field
          state={state}
          name="phone"
          required
          control={(props) => <Input type="tel" {...props} />}
        />
      </FieldGroup>

      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      <SubmitButton className="w-full" disabled={isPending}>
        {t("login")}
      </SubmitButton>
    </Form>
  );
};
