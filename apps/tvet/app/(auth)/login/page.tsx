import { redirect } from "next/navigation";

export interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; callbackSearch?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  redirect(`/login/username?${new URLSearchParams(params).toString()}`);
}
