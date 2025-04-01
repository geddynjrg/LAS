import { getTranslations } from "next-intl/server";

import { AlreadyHaveAccount } from "@/app/(auth)/already-have-account";
import { SignupForm } from "@/app/(auth)/signup/signup-form";

export interface SignupPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { callbackUrl } = await searchParams;

  const t = await getTranslations("SignUpPage");

  return (
    <>
      <div className="flex flex-col gap-2 pb-4">
        <h2 className="typo-h2">{t("title")}</h2>
        <p className="typo-body-medium">{t("description")}</p>
      </div>

      <SignupForm redirectTo={callbackUrl} />

      <AlreadyHaveAccount showDescription />
    </>
  );
}
