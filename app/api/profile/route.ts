import { getProfile } from '@/lib/api/profile';
import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileResponse = await getProfile();

    // The getProfile function returns the full response with data property
    // We need to maintain this structure for the client
    return NextResponse.json(profileResponse);
  } catch (error) {
    console.error('Profile API error:', error);

    if (error instanceof Error) {
      if (
        error.message === 'Authentication required' ||
        error.message.includes('401')
      ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 },
    );
  }
}
