import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export interface LoginLayoutProps {
  children?: ReactNode;
}

export default async function LoginLayout({ children }: LoginLayoutProps) {
  const t = await getTranslations("LoginPage");

  return (
    <div className="mx-auto max-w-[500px]">
      <div className="flex flex-col gap-2 pb-4">
        <h2 className="typo-h2">{t("title")}</h2>
        <p className="typo-body-medium">{t("description")}</p>
      </div>

      <div>
        {children}

        <div className="flex justify-center gap-2 pt-4">
          <p className="typo-body-medium">{t("doNotHaveAccount")}</p>
          <Link href="/signup" className="text-primary underline">
            {t("signUp")}
          </Link>
        </div>
      </div>

      <div className="pt-17 flex justify-center gap-2">
        <p className="typo-body-medium">{t("ForgotPassword")}</p>
        <Link href="/reset" className="text-primary underline">
          {t("reset")}
        </Link>
      </div>
    </div>
  );
}
