import { invalidateSession } from "@/lib/session";

export async function logout() {
  await invalidateSession();
} 