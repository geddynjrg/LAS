import { syncTaxonomyVocabularies } from '@/lib/api/taxonomy.service';
import { syncCountiesData } from '@/lib/api/counties.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Security check - require CRON_SECRET for external triggers (optional for dev)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.CRON_SECRET && process.env.NODE_ENV === 'production' && authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized - CRON_SECRET required in production' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting scheduled taxonomy and counties sync...');

    const startTime = Date.now();
    const results = {
      taxonomy: { success: false, error: null as string | null },
      counties: { success: false, error: null as string | null },
      duration: 0,
      timestamp: new Date().toISOString(),
    };

    // Sync taxonomy vocabularies
    try {
      await syncTaxonomyVocabularies();
      results.taxonomy.success = true;
      console.log('✅ Taxonomy vocabularies synced successfully');
    } catch (error) {
      results.taxonomy.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to sync taxonomy vocabularies:', error);
    }

    // Sync counties and constituencies
    try {
      await syncCountiesData();
      results.counties.success = true;
      console.log('✅ Counties and constituencies synced successfully');
    } catch (error) {
      results.counties.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to sync counties:', error);
    }

    results.duration = Date.now() - startTime;

    // Return success if at least one sync succeeded
    const overallSuccess = results.taxonomy.success || results.counties.success;
    const status = overallSuccess ? 200 : 500;

    console.log(`🏁 Taxonomy sync completed in ${results.duration}ms. Overall success: ${overallSuccess}`);

    return NextResponse.json(results, { status });

  } catch (error) {
    console.error('💥 Critical error in taxonomy sync endpoint:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Allow POST requests as well for flexibility
  return GET(request);
}