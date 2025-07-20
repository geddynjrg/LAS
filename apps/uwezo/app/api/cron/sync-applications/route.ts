import { NextRequest, NextResponse } from "next/server";

import { processSyncQueue } from "@/lib/api/sync.service";
import { prisma } from "@/lib/db/prisma";

interface CronLogEntry {
  timestamp: Date;
  processed: number;
  duration: number;
  errors?: string[];
  status: "success" | "partial" | "failed";
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const logEntry: CronLogEntry = {
    timestamp: new Date(),
    processed: 0,
    duration: 0,
    status: "success",
  };

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[CRON] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Starting sync job at", new Date().toISOString());

    // Check for stuck items (processing for too long)
    const stuckItems = await prisma.syncQueue.count({
      where: {
        status: "PROCESSING",
        updatedAt: {
          lt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes
        },
      },
    });

    if (stuckItems > 0) {
      console.warn(`[CRON] Found ${stuckItems} stuck items in processing state`);
      // Reset stuck items to pending
      await prisma.syncQueue.updateMany({
        where: {
          status: "PROCESSING",
          updatedAt: {
            lt: new Date(Date.now() - 10 * 60 * 1000),
          },
        },
        data: {
          status: "PENDING",
          error: "Reset from stuck processing state by cron job",
        },
      });
    }

    // Process the sync queue
    const result = await processSyncQueue();
    logEntry.processed = result.processed;

    // Get queue statistics
    const stats = await prisma.syncQueue.groupBy({
      by: ["status"],
      _count: true,
    });

    const statusCounts = stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    const duration = Date.now() - startTime;
    logEntry.duration = duration;

    console.log("[CRON] Sync job completed:", {
      processed: result.processed,
      duration: `${duration}ms`,
      queueStatus: statusCounts,
    });

    // Check if there are failed items
    const failedCount = statusCounts.FAILED || 0;
    if (failedCount > 0) {
      logEntry.status = "partial";
      console.warn(`[CRON] ${failedCount} items in failed state`);
    }

    // Store cron run log (optional - you could save this to a database)
    if (process.env.NODE_ENV === "production") {
      // You could store this in a CronLog table for monitoring
      console.log("[CRON] Run log:", JSON.stringify(logEntry));
    }

    return NextResponse.json({
      success: true,
      processed: result.processed,
      duration,
      timestamp: new Date().toISOString(),
      queueStatus: statusCounts,
      stuckItemsReset: stuckItems,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logEntry.status = "failed";
    logEntry.duration = duration;
    logEntry.errors = [error instanceof Error ? error.message : "Unknown error"];

    console.error("[CRON] Error in sync cron job:", error);
    
    // Send alert (you could integrate with monitoring services)
    if (process.env.NODE_ENV === "production") {
      // Example: Send to monitoring service
      console.error("[CRON] CRITICAL: Sync job failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

// Health check endpoint for monitoring
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check - just verify database connection
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
