import { logout } from '@/lib/api/logout';
import { redirect } from 'next/navigation';

export async function GET() {
  try {
    await logout();
  } catch (error) {
    // Log error but continue with logout process
    console.warn('[Logout] Error during logout:', error);
  }

  // Always redirect to login, even if logout fails
  redirect('/login');
}
