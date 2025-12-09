import { getProfile } from '@/lib/api/profile';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  // Separate profile fetching from authorization logic
  let isAdmin = false;

  try {
    // Get user profile from API to check roles
    const profile = await getProfile();
    const roles = profile.data?.roles || [];

    // Check if user has admin role (case-insensitive)
    isAdmin = roles.some(
      (role) =>
        role.toLowerCase() === 'admin' ||
        role.toLowerCase() === 'administrator',
    );
  } catch (error) {
    // Only log actual profile fetching errors
    console.error('Failed to fetch user profile:', error);
    // If we can't fetch profile, assume not admin for security
    isAdmin = false;
  }

  // Handle authorization after profile fetching is complete
  if (!isAdmin) {
    redirect('/dashboard');
  }

  return session;
}

// API-specific guards that return NextResponse instead of redirects
export async function requireAuthAPI(): Promise<
  { session: string } | NextResponse
> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return { session };
}

export async function requireAdminAPI(): Promise<
  { session: string } | NextResponse
> {
  const authResult = await requireAuthAPI();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Separate profile fetching from authorization logic
  let isAdmin = false;

  try {
    // Get user profile from API to check roles
    const profile = await getProfile();
    const roles = profile.data?.roles || [];

    // Check if user has admin role (case-insensitive)
    isAdmin = roles.some(
      (role) =>
        role.toLowerCase() === 'admin' ||
        role.toLowerCase() === 'administrator',
    );
  } catch (error) {
    // Log actual profile fetching errors
    console.error('Failed to fetch user profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }

  // Handle authorization after profile fetching is complete
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return authResult;
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
    console.error('Failed to fetch user roles:', error);
    return [];
  }
}

export async function isAdmin() {
  const roles = await getCurrentUserRoles();
  return roles.some(
    (role) =>
      role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator',
  );
}
