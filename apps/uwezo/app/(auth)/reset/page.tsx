"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { Container } from "@workspace/ui/components/container";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Underline } from "@workspace/ui/components/underline";
import { useForm } from "@workspace/ui/hooks/use-form";

import { resetAction } from "@/app/(auth)/reset/reset-action";
import { resetSchema } from "@/app/(auth)/reset/reset-schema";

export default function Page() {
  const t = useTranslations("ResetPage");
  const [state, formAction, isPending] = useForm(resetAction, resetSchema);

  if (state.success) {
    return (
      <Container className="max-w-[500px] pt-8">
        <div className="flex flex-col gap-2 pb-4">
          <h2 className="typo-h2">{t("success")}</h2>
          <p className="typo-body-medium">{t("successDescription")}</p>
        </div>

        <div className="flex gap-2 pt-4">
          <p className="typo-body-medium">{t("backTo")}</p>
          <Link href="/login" className="text-primary underline">
            {t("login")}
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-[500px] pt-8">
      <div className="flex flex-col gap-2 pb-4">
        <h2 className="typo-h2">{t("title")}</h2>
        <p className="typo-body-medium">{t("description")}</p>
      </div>

      <div>
        <Form action={formAction} className="space-y-6" autoComplete="on">
          <Field
            state={state}
            name="email"
            label={t("email")}
            required
            control={(props) => (
              <Input placeholder="email@email.com" {...props} />
            )}
          />

          <SubmitButton className="w-full" disabled={isPending}>
            {t("reset")}
          </SubmitButton>
        </Form>

        <div className="flex justify-center gap-2 pt-4">
          <p className="typo-body-medium">{t("alreadyHaveAccount")}</p>
          <Underline variant="primary">
            <Link href="/login" className="text-primary">
              {t("login")}
            </Link>
          </Underline>
        </div>
      </div>
    </Container>
  );
}
