import { redirect } from "next/navigation";
import { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/guards";

export interface AdminLayoutProps {
  children?: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  try {
    await requireAdmin();
  } catch (error) {
    // Not authenticated or not an admin
    redirect("/dashboard");
  }

  return <>{children}</>;
}
