import { getSession } from '@/lib/session';
import { checkSoftDuplicatesAcrossApplications } from '@/lib/soft-duplicate-check';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    phone?: string;
    nationalId?: string;
    applicationId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = await checkSoftDuplicatesAcrossApplications({
    phone: body.phone,
    nationalId: body.nationalId,
    excludeApplicationId: body.applicationId,
  });

  return NextResponse.json(result);
}
