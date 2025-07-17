"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type FC, type ReactNode } from "react";

export interface AuthenticatedProps {
  session: true | null;
  children?: ReactNode;
}

export const Authenticated: FC<AuthenticatedProps> = ({
  session,
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [session, pathname, router]);

  if (!session) {
    return null; // Return null while redirecting
  }

  return <>{children}</>;
};
