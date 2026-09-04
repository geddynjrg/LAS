/**
 * Assistive document authenticity heuristics (applicant-facing).
 * Ported from Majuu LMS DocumentPreviewCopilotService patterns.
 * Does not auto-approve — returns confidence bands for officer review flags.
 */

export type DocDeclaredType = 'national_id' | 'kra_pin' | 'passport' | 'other';

export type AuthenticityBand =
  | 'likely_match'
  | 'weak'
  | 'suspicious'
  | 'no_text';

export type DocumentAuthenticityResult = {
  assistive: true;
  declaredType: DocDeclaredType;
  band: AuthenticityBand;
  confidence: number; // 0–1 assistive only
  detectedTypeHints: string[];
  idCandidates: string[];
  dateCandidates: string[];
  fileChecks: {
    mimeOk: boolean;
    sizeOk: boolean;
    magicOk: boolean;
    notes: string[];
  };
  suggestedActions: string[];
  flagForReview: boolean;
  disclaimer: string;
};

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
]);

const MAX_BYTES = 30 * 1024 * 1024;

const TYPE_PATTERNS: Record<string, string[]> = {
  national_id: [
    'national identity',
    'republic of kenya',
    'id number',
    'identification',
    'serial number',
  ],
  kra_pin: ['kra', 'pin certificate', 'taxpayer', 'kenya revenue'],
  passport: ['passport', 'immigration', 'republic of kenya'],
};

function sniffMagic(buf: Buffer): {
  kind: 'pdf' | 'jpeg' | 'png' | 'unknown';
  ok: boolean;
} {
  if (buf.length >= 5 && buf.subarray(0, 5).toString('ascii') === '%PDF-') {
    return { kind: 'pdf', ok: true };
  }
  if (
    buf.length >= 3 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[2] === 0xff
  ) {
    return { kind: 'jpeg', ok: true };
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return { kind: 'png', ok: true };
  }
  return { kind: 'unknown', ok: false };
}

/** Best-effort text scrape from simple PDFs (no full parser dependency). */
export function extractRoughPdfText(buf: Buffer): string {
  const raw = buf.toString('latin1');
  const chunks: string[] = [];
  const streamRe = /stream\r?\n([\s\S]*?)endstream/gi;
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(raw)) !== null) {
    const body = m[1] || '';
    const printable = body.replace(/[^\x20-\x7E\n\r]/g, ' ');
    if (printable.trim().length > 20) chunks.push(printable);
  }
  // Also pull literal strings in parentheses (common in simple PDFs)
  const litRe = /\(([^\\()]{3,120})\)/g;
  while ((m = litRe.exec(raw)) !== null) {
    chunks.push(m[1] || '');
  }
  return chunks.join(' ').slice(0, 20000);
}

export function summarizeFromText(
  text: string | null | undefined,
  declaredType: DocDeclaredType,
): Pick<
  DocumentAuthenticityResult,
  | 'detectedTypeHints'
  | 'idCandidates'
  | 'dateCandidates'
  | 'band'
  | 'confidence'
  | 'flagForReview'
  | 'suggestedActions'
> {
  const lower = (text || '').toLowerCase();
  const hints: string[] = [];

  for (const [type, needles] of Object.entries(TYPE_PATTERNS)) {
    for (const needle of needles) {
      if (needle && lower.includes(needle)) {
        hints.push(type);
        break;
      }
    }
  }
  if (declaredType !== 'other') hints.push(`declared:${declaredType}`);

  const idMatches = Array.from(
    new Set((text || '').match(/\b\d{7,8}\b/g) || []),
  ).slice(0, 5);
  const dateMatches = Array.from(
    new Set(
      (text || '').match(
        /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/g,
      ) || [],
    ),
  ).slice(0, 5);

  const actions: string[] = [
    'Compare detected hints with the declared document type.',
    'If unclear, re-upload a sharper colour scan (full page, no glare).',
  ];

  let band: AuthenticityBand = 'no_text';
  let confidence = 0.15;
  let flagForReview = true;

  if (!(text || '').trim()) {
    actions.push('No readable text found — flag for officer visual review.');
    return {
      detectedTypeHints: hints,
      idCandidates: idMatches,
      dateCandidates: dateMatches,
      band,
      confidence,
      flagForReview: true,
      suggestedActions: actions,
    };
  }

  const declaredHint = declaredType;
  const matchesDeclared =
    declaredHint === 'other' ||
    hints.includes(declaredHint) ||
    (declaredHint === 'national_id' && idMatches.length > 0);

  if (
    matchesDeclared &&
    (declaredHint !== 'national_id' || idMatches.length > 0)
  ) {
    band = 'likely_match';
    confidence = 0.72;
    flagForReview = false;
    actions.push(
      'Heuristic match looks consistent — officers still confirm authenticity.',
    );
  } else if (hints.length > 0 && !matchesDeclared) {
    band = 'suspicious';
    confidence = 0.35;
    flagForReview = true;
    actions.push(
      'Detected document type may not match what you selected — flag for review.',
    );
  } else {
    band = 'weak';
    confidence = 0.4;
    flagForReview = true;
    actions.push('Weak text signals — upload may be blurry or wrong document.');
  }

  if (declaredHint === 'national_id' && idMatches.length === 0) {
    band = band === 'likely_match' ? 'weak' : band;
    confidence = Math.min(confidence, 0.45);
    flagForReview = true;
    actions.push('National ID expected but no 7–8 digit ID pattern found.');
  }

  if (
    declaredHint === 'kra_pin' &&
    !lower.includes('kra') &&
    !lower.includes('pin')
  ) {
    band = 'suspicious';
    confidence = 0.3;
    flagForReview = true;
  }

  return {
    detectedTypeHints: Array.from(new Set(hints)),
    idCandidates: idMatches,
    dateCandidates: dateMatches,
    band,
    confidence,
    flagForReview,
    suggestedActions: actions,
  };
}

export async function validateDocumentBuffer(input: {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
  declaredType: DocDeclaredType;
}): Promise<DocumentAuthenticityResult> {
  const notes: string[] = [];
  const mimeOk = ALLOWED_MIME.has(input.mimeType.toLowerCase());
  const sizeOk = input.buffer.length > 0 && input.buffer.length <= MAX_BYTES;
  const magic = sniffMagic(input.buffer);

  if (!mimeOk) notes.push(`Unexpected MIME type: ${input.mimeType}`);
  if (!sizeOk) notes.push('File empty or exceeds 30MB limit.');
  if (!magic.ok) notes.push('File header does not match JPEG/PNG/PDF.');

  let text = '';
  if (magic.kind === 'pdf') {
    text = extractRoughPdfText(input.buffer);
    if (!text.trim())
      notes.push('PDF had little extractable text (may be a scan).');
  } else {
    notes.push(
      'Image upload — text OCR not available in-portal; using file checks only.',
    );
  }

  const summary = summarizeFromText(text, input.declaredType);

  // Images without OCR cannot be "likely_match" on text alone
  let band = summary.band;
  let confidence = summary.confidence;
  let flagForReview = summary.flagForReview;
  if (magic.kind === 'jpeg' || magic.kind === 'png') {
    if (mimeOk && sizeOk && magic.ok) {
      band = 'weak';
      confidence = 0.45;
      flagForReview = true;
      summary.suggestedActions.push(
        'Image received. Officers (or LMS OCR) should confirm ID/KRA authenticity.',
      );
    } else {
      band = 'suspicious';
      confidence = 0.2;
      flagForReview = true;
    }
  }

  if (!mimeOk || !sizeOk || !magic.ok) {
    band = 'suspicious';
    confidence = 0.15;
    flagForReview = true;
  }

  return {
    assistive: true,
    declaredType: input.declaredType,
    band,
    confidence,
    detectedTypeHints: summary.detectedTypeHints,
    idCandidates: summary.idCandidates,
    dateCandidates: summary.dateCandidates,
    fileChecks: { mimeOk, sizeOk, magicOk: magic.ok, notes },
    suggestedActions: summary.suggestedActions,
    flagForReview,
    disclaimer:
      'Assistive document check only — not an auto-approval. Suspicious files are flagged for officer review.',
  };
}

export function formatAuthenticityReply(
  result: DocumentAuthenticityResult,
): string {
  const lines = [
    `Document check (${result.declaredType.replace('_', ' ')}): ${result.band.replace('_', ' ')} · confidence ${Math.round(result.confidence * 100)}% (assistive).`,
    result.flagForReview
      ? 'Flagged for officer review — do not treat as verified.'
      : 'Heuristics look consistent; officers still confirm before approval.',
  ];
  if (result.detectedTypeHints.length) {
    lines.push(`Hints: ${result.detectedTypeHints.join(', ')}`);
  }
  if (result.fileChecks.notes.length) {
    lines.push(result.fileChecks.notes.slice(0, 2).join(' '));
  }
  lines.push(result.suggestedActions[0] || result.disclaimer);
  return lines.join('\n');
}
