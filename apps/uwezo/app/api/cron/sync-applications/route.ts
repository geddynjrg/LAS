import { NextRequest, NextResponse } from "next/server";

import { processSyncQueue } from "@/lib/api/sync.service";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process the sync queue
    const result = await processSyncQueue();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in sync cron job:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
