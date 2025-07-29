"use client";

import { type FC, type ReactNode } from "react";

import { Loader } from "@workspace/ui/components/loader";

import { useRequireAuth } from "@/hooks/useSession";

export interface AuthGuardProps {
  children?: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

export const AuthGuard: FC<AuthGuardProps> = ({
  children,
  redirectTo = "/login",
  fallback,
}) => {
  const { isAuthenticated, isLoading } = useRequireAuth(redirectTo);

  if (isLoading) {
    return (
      fallback || (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null; // User is being redirected
  }

  return <>{children}</>;
};
