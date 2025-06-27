import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";
import { Divider } from "@workspace/ui/components/divider";
import { Underline } from "@workspace/ui/components/underline";
import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { loginSchema, type Login } from "@/app/(auth)/login/login-schema";
import { login } from "@/lib/api/login";
import { createSession } from "@/lib/session";

const loginAction: FormAction<Login> = async (_prev, formData) => {
  "use server";
  const values = getFormZodDataValues(formData, loginSchema);
  const { data, success, error } = loginSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const res = await login({
      username: data.email,
      password: data.password,
    });

    await createSession({
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    });
  } catch (error) {
    console.warn("Error during login:", error);

    return {
      success: false,
      errors: {},
      message: error instanceof Error ? error.message : "Unknown error",
      values,
    };
  }

  return { success: true };
};

export interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function Page({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;
  const t = await getTranslations("LoginPage");

  return (
    <Container className="max-w-[500px] pt-8">
      <div className="flex flex-col gap-2 pb-4">
        <h2 className="typo-h2">{t("title")}</h2>
        <p className="typo-body-medium">{t("description")}</p>
        <p className="typo-body-medium">
          {t.rich("flowDescription", {
            bold: (chunk) => <strong>{chunk}</strong>,
          })}
        </p>
        <p className="typo-body-medium">
          {t.rich("submittedDescription", {
            bold: (chunk) => <strong>{chunk}</strong>,
          })}
        </p>
      </div>

      <div>
        <LoginForm action={loginAction} redirectTo={callbackUrl} />

        <div className="flex justify-center gap-2 pt-4">
          <p className="typo-body-medium">{t("doNotHaveAccount")}</p>
          <Underline variant="primary">
            <Link href="signup" className="text-primary">
              {t("signUp")}
            </Link>
          </Underline>
        </div>
      </div>

      <Divider className="border-neutral-600 py-4">{t("or")}</Divider>

      <Button className="w-full bg-[color:hsl(142,78%,31%)] hover:bg-[color:hsl(143,78%,19%)]">
        {t("LogInThroughECitizen")}
      </Button>

      <div className="pt-17 flex justify-center gap-2">
        <p className="typo-body-medium">{t("ForgotPassword")}</p>
        <Link href="/reset" className="text-primary underline">
          {t("reset")}
        </Link>
      </div>
    </Container>
  );
}
