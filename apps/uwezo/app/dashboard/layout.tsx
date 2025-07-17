import { redirect } from "next/navigation";
import { ReactNode } from "react";

import { getSession } from "@/lib/session";

export interface DashboardLayoutProps {
  children?: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return <>{children}</>;
}
