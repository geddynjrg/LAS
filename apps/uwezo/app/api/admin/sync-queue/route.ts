import { NextRequest, NextResponse } from "next/server";

import { QueueStatus, SyncAction } from "@/generated/prisma";
import { getSyncQueueItems } from "@/lib/api/sync.service";
import { requireAdmin } from "@/lib/auth/guards";

interface SyncQueueFilters {
  status?: QueueStatus[];
  applicationId?: string;
  action?: SyncAction;
  dateFrom?: Date;
  dateTo?: Date;
}

export async function GET(request: NextRequest) {
  try {
    // Ensure user is admin
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const status = searchParams.get("status");
    const applicationId = searchParams.get("applicationId");
    const action = searchParams.get("action");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const filters: SyncQueueFilters = {};

    if (status) {
      filters.status = status
        .split(",")
        .filter((s) =>
          Object.values(QueueStatus).includes(s as QueueStatus),
        ) as QueueStatus[];
    }

    if (applicationId) {
      filters.applicationId = applicationId;
    }

    if (action && Object.values(SyncAction).includes(action as SyncAction)) {
      filters.action = action as SyncAction;
    }

    if (dateFrom) {
      filters.dateFrom = new Date(dateFrom);
    }

    if (dateTo) {
      filters.dateTo = new Date(dateTo);
    }

    const result = await getSyncQueueItems(filters, page, pageSize);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching sync queue items:", error);

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
