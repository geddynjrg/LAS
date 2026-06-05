import { getUploadDir } from '@/lib/constants/upload-dir';
import {
  isAllowedUploadMimeType,
  resolveFileMimeType,
} from '@workspace/ui/lib/files/mime-type';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export const UPLOAD_MAX_BYTES = parseInt(
  process.env.MAX_FILE_SIZE || String(30 * 1024 * 1024),
  10,
);

export interface ProcessedUpload {
  fid: string;
  filename: string;
  url: string;
  size: number;
  type: string;
}

async function ensureUploadDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName) || '.jpg';
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${randomString}${ext}`;
}

export async function processUploadedFile(
  file: File,
  applicationId?: string,
): Promise<{ ok: true; file: ProcessedUpload } | { ok: false; error: string }> {
  if (!file || typeof file.size !== 'number' || file.size <= 0) {
    return { ok: false, error: 'No file provided' };
  }

  if (file.size > UPLOAD_MAX_BYTES) {
    return {
      ok: false,
      error: `File exceeds maximum size limit of ${Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)}MB`,
    };
  }

  const mimeType = resolveFileMimeType(file);
  if (!isAllowedUploadMimeType(file)) {
    return {
      ok: false,
      error: `File type "${mimeType}" is not allowed for file "${file.name}"`,
    };
  }

  const uploadDir = getUploadDir();
  await ensureUploadDir(uploadDir);

  const appDir = applicationId ? path.join(uploadDir, applicationId) : uploadDir;
  if (applicationId) {
    await ensureUploadDir(appDir);
  }

  const uniqueFilename = generateUniqueFilename(file.name);
  const filePath = path.join(appDir, uniqueFilename);
  const publicUrl = applicationId
    ? `/files/${applicationId}/${uniqueFilename}`
    : `/files/misc/${uniqueFilename}`;

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, new Uint8Array(arrayBuffer));

  return {
    ok: true,
    file: {
      fid: Date.now().toString(),
      filename: file.name,
      url: publicUrl,
      size: file.size,
      type: mimeType,
    },
  };
}
