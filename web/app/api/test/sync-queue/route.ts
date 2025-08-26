import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get sync queue count
    const count = await prisma.syncQueue.count();

    // Get first 5 items
    const items = await prisma.syncQueue.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get status counts
    const statusCounts = await prisma.syncQueue.groupBy({
      by: ['status'],
      _count: true,
    });

    return NextResponse.json({
      totalCount: count,
      statusCounts,
      sampleItems: items,
      message:
        count > 0
          ? `Found ${count} items in sync queue`
          : 'No items in sync queue',
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
