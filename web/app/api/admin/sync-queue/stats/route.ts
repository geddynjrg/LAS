import { NextRequest, NextResponse } from "next/server";

import { getSyncQueueStatistics } from "@/lib/api/sync.service";
import { requireAdminAPI } from "@/lib/auth/guards";

export async function GET(_request: NextRequest) {
  try {
    // Ensure user is admin
    const authResult = await requireAdminAPI();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const stats = await getSyncQueueStatistics();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching sync queue statistics:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
