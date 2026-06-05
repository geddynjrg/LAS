const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const;

const EXTENSION_MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pdf: 'application/pdf',
};

export function resolveFileMimeType(file: {
  name: string;
  type?: string | null;
}): string {
  const rawType = file.type?.trim().toLowerCase() ?? '';

  if (
    rawType &&
    rawType !== 'application/octet-stream' &&
    ALLOWED_UPLOAD_MIME_TYPES.includes(
      rawType as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number],
    )
  ) {
    return rawType;
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && EXTENSION_MIME_MAP[ext]) {
    return EXTENSION_MIME_MAP[ext];
  }

  return rawType || 'application/octet-stream';
}

export function isAllowedUploadMimeType(file: {
  name: string;
  type?: string | null;
}): boolean {
  const mimeType = resolveFileMimeType(file);
  return ALLOWED_UPLOAD_MIME_TYPES.includes(
    mimeType as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number],
  );
}
