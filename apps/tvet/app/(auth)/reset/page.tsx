"use client";

import { useTranslations } from "next-intl";

import { Alert } from "@workspace/ui/components/alert";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { AlreadyHaveAccount } from "@/app/(auth)/already-have-account";
import { resetRequestAction } from "@/app/(auth)/reset/reset-request-action";
import { resetRequestSchema } from "@/app/(auth)/reset/reset-request-schema";

export default function ResetRequestPage() {
  const t = useTranslations("ResetRequestPage");
  const [state, formAction, isPending] = useForm(
    resetRequestAction,
    resetRequestSchema,
  );

  if (state.success) {
    return (
      <>
        <div className="flex flex-col gap-2 pb-4">
          <h2 className="typo-h2">{t("success")}</h2>
          <p className="typo-body-medium">{state.message}</p>
        </div>

        <AlreadyHaveAccount />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 pb-4">
        <h2 className="typo-h2">{t("title")}</h2>
        <p className="typo-body-medium">{t("description")}</p>
      </div>

      {!state.success && state.message && (
        <Alert variant="error" className="mb-4">
          {state.message}
        </Alert>
      )}

      <Form action={formAction} className="space-y-6" autoComplete="on">
        <Field
          state={state}
          name="email"
          label={t("email")}
          required
          control={(props) => <Input {...props} />}
        />

        <SubmitButton className="w-full" disabled={isPending}>
          {t("reset")}
        </SubmitButton>
      </Form>

      <AlreadyHaveAccount />
    </>
  );
}
