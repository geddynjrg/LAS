// Client-safe version of auth guards that doesn't import server-only code

export async function getCurrentUserRolesClient(): Promise<string[]> {
  // This should call a server action instead of importing server-only code
  const { getCurrentUserRolesAction } = await import('@/app/actions/auth');
  return getCurrentUserRolesAction();
}

export async function isAdminClient(): Promise<boolean> {
  const roles = await getCurrentUserRolesClient();
  return roles.some(
    (role) =>
      role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator',
  );
}
