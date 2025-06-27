import { redirect } from "next/navigation";

import { logout } from "@/lib/api/logout";

export async function GET() {
  await logout();

  redirect("/login");
} 