import { LoginForm } from "@/app/(auth)/login/username/login-form";

interface SearchParams {
  callbackUrl: string | undefined;
  callbackSearch: string | undefined;
}

export interface LoginPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return <LoginForm redirectTo={createCallbackUrl(params)} />;
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
