import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Sync queue test endpoint is working",
    timestamp: new Date().toISOString(),
  });
} 