import { NextRequest, NextResponse } from "next/server";

import { QueueStatus, SyncAction } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  try {
    // Create test items with different statuses
    const testItems = [
      {
        applicationId: "APP-TEST-FAILED-001",
        action: SyncAction.CREATE,
        payload: JSON.stringify({}),
        status: QueueStatus.FAILED,
        attempts: 3,
        maxAttempts: 3,
        error:
          "Connection timeout: Unable to reach external API after 3 attempts. The server might be down or experiencing high load.",
        processedAt: new Date(),
      },
      {
        applicationId: "APP-TEST-PROCESSING-001",
        action: SyncAction.UPDATE,
        payload: JSON.stringify({}),
        status: QueueStatus.PROCESSING,
        attempts: 1,
        maxAttempts: 3,
        updatedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        applicationId: "APP-TEST-PENDING-002",
        action: SyncAction.CREATE,
        payload: JSON.stringify({}),
        status: QueueStatus.PENDING,
        attempts: 0,
        maxAttempts: 3,
        scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      },
    ];

    const created = await prisma.syncQueue.createMany({
      data: testItems,
    });

    return NextResponse.json({
      success: true,
      message: `Created ${created.count} test queue items`,
      items: testItems.map((item) => ({
        applicationId: item.applicationId,
        status: item.status,
      })),
    });
  } catch (error) {
    console.error("Error creating test queue items:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
