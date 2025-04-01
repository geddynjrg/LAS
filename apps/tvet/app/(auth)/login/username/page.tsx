import { LoginForm } from "@/app/(auth)/login/username/login-form";

export interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <>
      <LoginForm redirectTo={callbackUrl} />
      {/* 
      <Underline
        variant="primary"
        asChild
        className="text-primary mx-auto mt-4"
      >
        <Link
          href={`/login/username?callbackUrl=${encodeURIComponent(callbackUrl ?? "/dashboard")}`}
        >
          {t("usePhoneInstead")}
        </Link>
      </Underline> */}
    </>
  );
}
