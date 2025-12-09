'use server';

import { getCurrentUserRoles as getUserRoles } from '@/lib/auth/guards';

export async function getCurrentUserRolesAction() {
  try {
    const roles = await getUserRoles();
    return roles;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}
