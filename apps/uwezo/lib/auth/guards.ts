import { redirect } from "next/navigation";

import { getProfile } from "@/lib/api/profile";
import { getSession } from "@/lib/session";

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  try {
    // Get user profile from API to check roles
    const profile = await getProfile();
    const roles = profile.data?.roles || [];

    // Check if user has admin role (case-insensitive)
    const isAdmin = roles.some(
      (role) =>
        role.toLowerCase() === "admin" ||
        role.toLowerCase() === "administrator",
    );

    if (!isAdmin) {
      redirect("/dashboard");
    }
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    redirect("/dashboard");
  }

  return session;
}

export async function getCurrentUserRoles() {
  const session = await getSession();

  if (!session) {
    return [];
  }

  try {
    const profile = await getProfile();
    return profile.data?.roles || [];
  } catch (error) {
    console.error("Failed to fetch user roles:", error);
    return [];
  }
}

export async function isAdmin() {
  const roles = await getCurrentUserRoles();
  return roles.some(
    (role) =>
      role.toLowerCase() === "admin" || role.toLowerCase() === "administrator",
  );
}
