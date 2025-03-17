"use client";

import type { FC, ReactNode } from "react";

export interface AuthenticatedProps {
  // session: Session | null;
  children?: ReactNode;
}

export const Authenticated: FC<AuthenticatedProps> = ({
  // session,
  children,
}) => {
  // TODO: Implement the Authenticated component

  // const pathname = usePathname();

  // if (!session) {
  //   return redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  // }

  return children;
};
