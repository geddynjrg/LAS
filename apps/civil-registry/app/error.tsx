"use client";

import { ErrorPage } from "@workspace/ui/components/error-page";

export interface AppErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppErrorPage(props: AppErrorPageProps) {
  return <ErrorPage {...props} />;
}
