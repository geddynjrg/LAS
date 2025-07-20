import { ReactNode } from "react";

import { Authenticated } from "@/components/authenticated";
import { getSession } from "@/lib/session";

export interface DashboardLayoutProps {
  children?: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getSession();

  return (
    <Authenticated session={session ? true : null}>{children}</Authenticated>
  );
}
