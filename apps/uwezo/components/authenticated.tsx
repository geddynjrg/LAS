"use client";

import type { Session } from "next-auth";
import { redirect, usePathname } from "next/navigation";
import type { FC, ReactNode } from "react";

export interface AuthenticatedProps {
  session: Session | null;
  children?: ReactNode;
}

export const Authenticated: FC<AuthenticatedProps> = ({
  session,
  children,
}) => {
  const pathname = usePathname();

  if (!session) {
    return redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  return children;
};
