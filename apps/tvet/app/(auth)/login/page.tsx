import { redirect } from "next/navigation";

export interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl = await (await searchParams).callbackUrl;

  if (callbackUrl) {
    redirect(`/login/phone?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  redirect("login/phone");

  return null;
}
