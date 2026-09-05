import { saveLoanUploadMeta } from '@/lib/assistive-chat-apply-flow';
import {
  type DocDeclaredType,
  formatAuthenticityReply,
  validateDocumentBuffer,
} from '@/lib/document-authenticity';
import { getSession } from '@/lib/session';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

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

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

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
  const applicationId = String(form.get('applicationId') || '');
  const category = String(form.get('category') || '');
  const persist = String(form.get('persist') || '') === '1';
  const ocrPassed = String(form.get('ocrPassed') || '') === '1';
  const ocrConfidence = Number(form.get('ocrConfidence') || 0);

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: 'Missing file' },
      { status: 400 },
    );
  }

  const isImage = (file.type || '').startsWith('image/');
  const gatedFields = [
    'groupregistrationcertificate',
    'listofmembersoncertificate',
    'groupmeetingminutes',
    'groupcredithistory',
    'national_id',
    'kra_pin',
    'passport',
  ];
  const catKey = category.replace(/[^a-z0-9]/gi, '').toLowerCase();
  const needsOcrGate =
    isImage &&
    (declaredType === 'national_id' ||
      declaredType === 'kra_pin' ||
      declaredType === 'passport' ||
      gatedFields.includes(catKey) ||
      Boolean(category));

  if (needsOcrGate && (!ocrPassed || ocrConfidence < 0.5)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Capture rejected: scan the document required for this field until OCR confidence is high enough, then Capture. Wrong document types stay locked (~20%).',
      },
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
  const authenticity = formatAuthenticityReply(result);

  if (persist && applicationId && category) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: 'File too large', reply: authenticity },
        { status: 400 },
      );
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: `File type ${file.type} not allowed`,
          reply: authenticity,
        },
        { status: 400 },
      );
    }
    try {
      const appDir = path.join(UPLOAD_DIR, applicationId);
      await fs.mkdir(appDir, { recursive: true });
      const ext = path.extname(file.name) || '.bin';
      const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      const filePath = path.join(appDir, unique);
      await fs.writeFile(filePath, buffer);
      const meta = {
        fid: Date.now().toString(),
        filename: file.name,
        url: `/files/${applicationId}/${unique}`,
        size: file.size,
        type: file.type,
      };
      await saveLoanUploadMeta(applicationId, category, meta);
      return NextResponse.json({
        ok: true,
        result,
        persisted: true,
        reply: `${authenticity}\nSaved to application as ${category}.`,
        nextHint: 'Pick another field or stage to continue editing in chat.',
        phase: 'field_pick',
      });
    } catch (err) {
      return NextResponse.json(
        {
          ok: false,
          error: err instanceof Error ? err.message : 'Upload save failed',
          reply: authenticity,
        },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    result,
    reply: authenticity,
    nextHint:
      'Continue official uploads on your apply steps so the file is stored on your application, or select a document field in chat to save it.',
  });
}
