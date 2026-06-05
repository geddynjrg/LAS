import path from 'path';

/**
 * Resolves the upload directory used for file storage and sync reads.
 * In Docker, set UPLOAD_DIR=/app/web/uploads and mount a volume there.
 */
export function getUploadDir(): string {
  const configured = process.env.UPLOAD_DIR;
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);
  }
  return path.join(process.cwd(), 'web', 'uploads');
}

/**
 * Resolves a stored file URL (e.g. /files/APP-xxx/file.pdf) to an absolute path.
 */
export function resolveUploadFilePath(fileUrl: string): string {
  const uploadDir = getUploadDir();
  const relativePath = fileUrl.startsWith('/files/')
    ? fileUrl.replace('/files/', '')
    : fileUrl.replace(/^\/+/, '');
  return path.join(uploadDir, relativePath);
}
