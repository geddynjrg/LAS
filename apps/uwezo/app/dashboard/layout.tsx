import { ReactNode } from "react";

import { Authenticated } from "@/components/authenticated";
import { auth } from "@/lib/auth";

export interface DashboardLayoutProps {
  children?: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();

  return <Authenticated session={session}>{children}</Authenticated>;
}
