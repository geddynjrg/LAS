import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { LoginForm } from "@/app/(auth)/login/username/login-form";

export interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; callbackSearch?: string }>;
}

interface SearchParams {
  callbackUrl?: string;
  callbackSearch?: string;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const t = await getTranslations("LoginPage");

  return (
    <>
      <div className="flex flex-col gap-2 pb-4">
        <h2 className="typo-h2">{t("title")}</h2>
        <p className="typo-body-medium">{t("description")}</p>
      </div>

      <LoginForm redirectTo={createCallbackUrl(params)} />

      <div className="flex justify-center gap-2 pt-4">
        <p className="typo-body-medium">{t("doNotHaveAccount")}</p>
        <Link href="/signup" className="text-primary underline">
          {t("signUp")}
        </Link>
      </div>

      <div className="pt-17 flex justify-center gap-2">
        <p className="typo-body-medium">{t("ForgotPassword")}</p>
        <Link href="/reset" className="text-primary underline">
          {t("reset")}
        </Link>
      </div>
    </>
  );
}

function createCallbackUrl({ callbackUrl, callbackSearch }: SearchParams) {
  if (!callbackUrl) {
    return undefined;
  }

  if (!callbackSearch) {
    return callbackUrl;
  }

  return `${callbackUrl}?${new URLSearchParams(callbackSearch).toString()}`;
}
