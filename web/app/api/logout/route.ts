import { invalidateSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await invalidateSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}

export async function GET() {
  // Support GET for direct navigation logout
  try {
    await invalidateSession();
    redirect('/login');
  } catch (error) {
    console.error('Logout API error:', error);
    redirect('/login');
  }
}
