import { NextRequest, NextResponse } from "next/server";

import { retryAllFailedItems } from "@/lib/api/sync.service";
import { requireAdmin } from "@/lib/auth/guards";

export async function POST(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const result = await retryAllFailedItems();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error retrying all failed items:", error);

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
