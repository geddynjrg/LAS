"use client";

import { type FC, type ReactNode } from "react";

import { Loader } from "@workspace/ui/components/loader";

import { useRequireAuth } from "@/hooks/useSession";

export interface AuthenticatedProps {
  children?: ReactNode;
  redirectTo?: string;
}

export const Authenticated: FC<AuthenticatedProps> = ({
  children,
  redirectTo = "/login",
}) => {
  const { isAuthenticated, isLoading } = useRequireAuth(redirectTo);

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Return null while redirecting
  }

  return <>{children}</>;
};
