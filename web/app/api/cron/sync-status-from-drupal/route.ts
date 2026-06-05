import { syncApplicationStatusFromDrupal } from '@/lib/data/drupal-status-sync';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (
      process.env.CRON_SECRET &&
      process.env.NODE_ENV === 'production' &&
      authHeader !== expectedAuth
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting Drupal → portal status sync...');
    const startTime = Date.now();
    const result = await syncApplicationStatusFromDrupal();
    const duration = Date.now() - startTime;

    console.log('[CRON] Drupal → portal status sync completed:', {
      ...result,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      ...result,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Drupal → portal status sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
