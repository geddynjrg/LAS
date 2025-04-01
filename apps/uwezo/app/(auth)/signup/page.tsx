"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { Divider } from "@workspace/ui/components/divider";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Underline } from "@workspace/ui/components/underline";
import { useForm } from "@workspace/ui/hooks/use-form";

import { signupAction } from "@/app/(auth)/signup/signup-action";
import { signupSchema } from "@/app/(auth)/signup/signup-schema";

export default function Page() {
  const t = useTranslations("SignUpPage");
  const [state, formAction, isPending] = useForm(signupAction, signupSchema);

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

          <Field
            state={state}
            name="passwordConfirm"
            label={t("passwordConfirm")}
            required
            control={(props) => (
              <Input
                type="password"
                placeholder="••••••••••••••••••••"
                {...props}
              />
            )}
          />

          <SubmitButton className="w-full" disabled={isPending}>
            {t("signUp")}
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

      <Divider className="border-neutral-600 py-4">{t("or")}</Divider>

      <Button className="w-full bg-[color:hsl(142,78%,31%)] hover:bg-[color:hsl(143,78%,19%)]">
        {t("registerThroughECitizen")}
      </Button>
    </Container>
  );
}
