// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'UP' }, { status: 200 });
}

// Optional: support HEAD requests (some healthcheck tools prefer HEAD)
// export async function HEAD() {
//   return new NextResponse(status: 'UP', { status: 200 });
// }
