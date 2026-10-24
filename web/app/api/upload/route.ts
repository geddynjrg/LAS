import crypto from 'crypto';
import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = Number.parseInt(
  process.env.MAX_FILE_SIZE || '31457280',
  10,
);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
  'application/pdf',
]);

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomString}${ext}`;
}

async function ensureUploadDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function saveFile(
  file: File,
  applicationId?: string | null,
): Promise<{
  fid: string;
  filename: string;
  url: string;
  size: number;
  type: string;
}> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File exceeds maximum size limit of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`File type "${file.type}" is not allowed`);
  }

  await ensureUploadDir(UPLOAD_DIR);
  const appDir = applicationId
    ? path.join(UPLOAD_DIR, applicationId)
    : UPLOAD_DIR;
  if (applicationId) {
    await ensureUploadDir(appDir);
  }

  const uniqueFilename = generateUniqueFilename(file.name);
  const filePath = path.join(appDir, uniqueFilename);
  const publicUrl = applicationId
    ? `/files/${applicationId}/${uniqueFilename}`
    : `/files/misc/${uniqueFilename}`;

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  return {
    fid: `${Date.now()}`,
    filename: file.name,
    url: publicUrl,
    size: file.size,
    type: file.type,
  };
}

export async function POST(request: Request) {
  const started = Date.now();

  try {
    const formData = await request.formData();
    const applicationId = formData.get('applicationId')?.toString() || null;

    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (
        (key === 'file' || key === 'files' || key.startsWith('files')) &&
        value instanceof File &&
        value.size > 0
      ) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 },
      );
    }

    const uploaded = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        uploaded.push(await saveFile(file, applicationId));
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error.message
            : `Failed to upload ${file.name}`,
        );
      }
    }

    if (uploaded.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: errors.join(', ') || 'Upload failed',
        },
        { status: 400 },
      );
    }

    const primary = uploaded[0]!;
    console.log(
      `[api/upload] saved ${uploaded.length} file(s) in ${Date.now() - started}ms`,
    );

    return NextResponse.json({
      success: true,
      fid: primary.fid,
      filename: primary.filename,
      url: primary.url,
      size: primary.size,
      type: primary.type,
      files: uploaded,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    });
  } catch (error) {
    console.error('[api/upload] failed:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Upload failed unexpectedly',
      },
      { status: 500 },
    );
  }
}
