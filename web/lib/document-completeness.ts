export type FileMeta =
  | {
      fid?: number | null;
      filename?: string | null;
      url?: string | null;
    }
  | null
  | undefined;

export type CoreGroupDocInput = {
  groupRegistrationCertificate?: unknown;
  listOfMembersOnCertificate?: unknown;
  groupMeetingMinutes?: unknown;
};

function asFileMeta(value: unknown): FileMeta {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  return {
    fid:
      typeof record.fid === 'number'
        ? record.fid
        : Number(record.fid ?? 0) || 0,
    filename: typeof record.filename === 'string' ? record.filename : '',
    url: typeof record.url === 'string' ? record.url : '',
  };
}

function hasFile(value: unknown): boolean {
  const file = asFileMeta(value);
  if (!file) return false;
  const fid = Number(file.fid ?? 0);
  const filename = (file.filename || '').trim();
  const url = (file.url || '').trim();
  return fid > 0 || filename.length > 0 || url.length > 0;
}

/** Rule-based completeness for Core group LAS before continue/submit. */
export function validateCoreGroupDocuments(input: CoreGroupDocInput): {
  ok: boolean;
  errors: Record<string, string[]>;
  messages: string[];
} {
  const errors: Record<string, string[]> = {};

  if (!hasFile(input.groupRegistrationCertificate)) {
    errors.groupRegistrationCertificate = [
      'Group registration certificate is required before you can continue',
    ];
  }
  if (!hasFile(input.listOfMembersOnCertificate)) {
    errors.listOfMembersOnCertificate = [
      'List of members on certificate is required before you can continue',
    ];
  }

  const minutes = Array.isArray(input.groupMeetingMinutes)
    ? input.groupMeetingMinutes
    : input.groupMeetingMinutes
      ? [input.groupMeetingMinutes]
      : [];
  if (!minutes.some(hasFile)) {
    errors.groupMeetingMinutes = [
      'At least one group meeting minutes file is required before you can continue',
    ];
  }

  const messages = Object.values(errors).flat();
  return { ok: messages.length === 0, errors, messages };
}
