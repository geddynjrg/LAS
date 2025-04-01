"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { Alert } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { useForm } from "@workspace/ui/hooks/use-form";

import { AlreadyHaveAccount } from "@/app/(auth)/already-have-account";
import { resetAction } from "@/app/(auth)/reset/[...path]/reset-action";
import { resetSchema } from "@/app/(auth)/reset/[...path]/reset-schema";

export interface ResetPasswordPageProps {
  params: Promise<{
    path: string[];
  }>;
}

export default async function PasswordChangePage(
  props: ResetPasswordPageProps,
) {
  const t = useTranslations("ResetPage");
  const [state, formAction, isPending] = useForm(resetAction, resetSchema);

  const params = await props.params;
  const [uid, timeStamp, hash] = params.path;

  if (!uid || !timeStamp || !hash) {
    throw new Error("Invalid parameters");
  }

  if (state.success) {
    return (
      <>
        <div className="flex flex-col gap-2 pb-4">
          <h2 className="typo-h2">{t("success")}</h2>
          <p className="typo-body-medium">{state.message}</p>
        </div>

        <div className="flex justify-center gap-2 pt-4">
          <Button asChild>
            <Link href="/login">{t("login")}</Link>
          </Button>
        </div>
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
        <input type="hidden" name="uid" value={uid} />
        <input type="hidden" name="timeStamp" value={timeStamp} />
        <input type="hidden" name="hash" value={hash} />

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
          {t("change")}
        </SubmitButton>
      </Form>

      <AlreadyHaveAccount />
    </>
  );
}
