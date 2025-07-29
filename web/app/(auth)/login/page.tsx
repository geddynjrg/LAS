import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Container } from "@workspace/ui/components/container";
import { Divider } from "@workspace/ui/components/divider";
import { Underline } from "@workspace/ui/components/underline";

import { EmailLoginForm } from "@/app/(auth)/login/email-login-form";
import {
  emailLoginAction,
  phoneLoginAction,
} from "@/app/(auth)/login/login-actions";
import { PhoneLoginForm } from "@/app/(auth)/login/phone-login-form";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; type?: string }>;
}) {
  const params = await searchParams;
  const loginType = params.type === "email" ? "email" : "phone";
  const callbackUrl = params.callbackUrl;
  const t = await getTranslations("LoginPage");

  return (
    <Container className="max-w-[500px] pt-8">
      <main>
        <header className="flex flex-col gap-2 pb-4">
          <h1 className="typo-h2">{t("title")}</h1>
          <p className="typo-body-medium">{t("description")}</p>
          <p className="typo-body-medium">
            {t.rich("flowDescription", {
              bold: (chunk: React.ReactNode) => <strong>{chunk}</strong>,
            })}
          </p>
          <p className="typo-body-medium">
            {t.rich("submittedDescription", {
              bold: (chunk: React.ReactNode) => <strong>{chunk}</strong>,
            })}
          </p>
        </header>

        <section aria-labelledby="login-form-heading">
          <h2 id="login-form-heading" className="sr-only">
            {t("loginFormHeading")}
          </h2>

          {loginType === "phone" ? (
            <PhoneLoginForm
              action={phoneLoginAction}
              redirectTo={callbackUrl}
            />
          ) : (
            <EmailLoginForm
              action={emailLoginAction}
              redirectTo={callbackUrl}
            />
          )}

          <Divider className="my-6">{t("or")}</Divider>

          <nav
            aria-label="Authentication options"
            className="flex flex-col items-center gap-3"
          >
            <div className="flex justify-center gap-2">
              <Link
                href={`/login?type=${loginType === "phone" ? "email" : "phone"}${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="text-primary"
                aria-label={`Switch to ${loginType === "phone" ? "email" : "phone"} login`}
              >
                <Underline variant="primary" className="text-primary">
                  {loginType === "phone"
                    ? "Use e-mail instead of phone"
                    : "Use phone instead of e-mail"}
                </Underline>
              </Link>
            </div>

            <div className="flex justify-center gap-2">
              <span className="typo-body-medium">{t("doNotHaveAccount")}</span>
              <Underline variant="primary">
                <Link href="/signup" className="text-primary">
                  {t("signUp")}
                </Link>
              </Underline>
            </div>

            <div className="flex justify-center gap-2">
              <span className="typo-body-medium">{t("ForgotPassword")}</span>
              <Link href="/reset" className="text-primary underline">
                {t("reset")}
              </Link>
            </div>
          </nav>
        </section>
      </main>
    </Container>
  );
}
