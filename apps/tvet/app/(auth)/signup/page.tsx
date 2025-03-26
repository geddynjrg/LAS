import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Container } from "@workspace/ui/components/container";

import { SignupForm } from "@/app/(auth)/signup/signup-form";

export default async function Page() {
  const t = await getTranslations("SignUpPage");

  return (
    <Container className="max-w-[500px] pt-8">
      <div className="flex flex-col gap-2 pb-4">
        <h2 className="typo-h2">{t("title")}</h2>
        <p className="typo-body-medium">{t("description")}</p>
      </div>

      <SignupForm />

      <div className="flex justify-center gap-2 pt-4">
        <p className="typo-body-medium">{t("alreadyHaveAccount")}</p>
        <Link href="/login/username" className="text-primary underline">
          {t("login")}
        </Link>
      </div>
    </Container>
  );
}
