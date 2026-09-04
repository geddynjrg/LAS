import {
  type DocDeclaredType,
  formatAuthenticityReply,
  validateDocumentBuffer,
} from '@/lib/document-authenticity';
import { getSession } from '@/lib/session';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const TYPE_MAP: Record<string, DocDeclaredType> = {
  id: 'national_id',
  national_id: 'national_id',
  'national-id': 'national_id',
  kra: 'kra_pin',
  kra_pin: 'kra_pin',
  'kra-pin': 'kra_pin',
  passport: 'passport',
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Please sign in through the assistant first.' },
      { status: 401 },
    );
  }

  const form = await request.formData();
  const file = form.get('file');
  const declaredRaw = String(form.get('declaredType') || 'other').toLowerCase();
  const declaredType: DocDeclaredType = TYPE_MAP[declaredRaw] || 'other';

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: 'Missing file' },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await validateDocumentBuffer({
    buffer,
    mimeType: file.type || 'application/octet-stream',
    fileName: file.name,
    declaredType,
  });

  return NextResponse.json({
    ok: true,
    result,
    reply: formatAuthenticityReply(result),
    nextHint:
      'Continue official uploads on your apply steps (group-data / members documents) so the file is stored on your application. Open /dashboard to resume.',
  });
}
