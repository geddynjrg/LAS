import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Underline } from "@workspace/ui/components/underline";

import { LoginForm } from "@/app/(auth)/login/email/login-form";

async function signInAction(_prev: unknown, formData: FormData) {
  "use server";

  // TODO: implement login

  const redirectTo = formData.get("redirectTo") as string | undefined;

  return redirect(redirectTo ?? "/dashboard");
}

export interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;
  const t = await getTranslations("LoginPage");

  return (
    <div>
      <LoginForm action={signInAction} redirectTo={callbackUrl} />

      <Underline
        variant="primary"
        asChild
        className="text-primary mx-auto mt-4"
      >
        <Link
          href={`/login/phone?callbackUrl=${encodeURIComponent(callbackUrl ?? "/dashboard")}`}
        >
          {t("usePhoneInstead")}
        </Link>
      </Underline>
    </div>
  );
}
