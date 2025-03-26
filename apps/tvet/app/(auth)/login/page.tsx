import { redirect } from "next/navigation";

export interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl = (await searchParams).callbackUrl;

  if (callbackUrl) {
    redirect(`/login/username?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  redirect("/login/username");
}
