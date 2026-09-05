/**
 * Field-aware document OCR scoring for chatbot capture gate.
 * Maps upload field / category → expected document type, then scores OCR text
 * against that type (not Kenyan-ID-only).
 */

export type OcrDocType =
  | 'national_id'
  | 'kra_pin'
  | 'passport'
  | 'group_certificate'
  | 'bank_document'
  | 'meeting_minutes'
  | 'member_list'
  | 'expression_of_interest'
  | 'generic_document';

export type OcrScoreResult = {
  confidence: number; // 0–1
  rawConfidence: number;
  matchedKeywords: string[];
  idCandidates: string[];
  expectedType: OcrDocType;
  detectedType: OcrDocType | 'unknown';
  looksLikeKenyanId: boolean;
  looksLikeDeclaredType: boolean;
  pass: boolean;
  rejectReason?: string;
  overlayLines: string[];
};

/** Minimum confidence when the scan matches the expected document. */
export const OCR_CAPTURE_THRESHOLD = 0.58;

/** Forced confidence when the scan does not match the field’s document. */
export const OCR_MISMATCH_CONFIDENCE = 0.2;

type DocProfile = {
  type: OcrDocType;
  label: string;
  keywords: string[];
  patterns?: RegExp[];
  minHits: number;
};

const PROFILES: DocProfile[] = [
  {
    type: 'national_id',
    label: 'Kenyan National ID',
    keywords: [
      'republic of kenya',
      'national identity',
      'identity card',
      'serial number',
      'id number',
      'date of birth',
      'full names',
      'district of birth',
      'sex',
    ],
    minHits: 2,
  },
  {
    type: 'kra_pin',
    label: 'KRA PIN certificate',
    keywords: [
      'kenya revenue',
      'kenya revenue authority',
      'kra',
      'pin certificate',
      'taxpayer',
      'personal identification number',
      'pin',
    ],
    patterns: [/A\d{9}[A-Z]/i],
    minHits: 1,
  },
  {
    type: 'passport',
    label: 'passport biodata page',
    keywords: [
      'passport',
      'immigration',
      'republic of kenya',
      'nationality',
      'date of expiry',
      'place of birth',
      'passport no',
    ],
    minHits: 1,
  },
  {
    type: 'group_certificate',
    label: 'group registration certificate',
    keywords: [
      'certificate of registration',
      'registration certificate',
      'registered',
      'societies',
      'self help',
      'self-help',
      'community based',
      'cbo',
      'registrar',
      'registration number',
      'cooperative',
      'co-operative',
      'ministry',
    ],
    minHits: 1,
  },
  {
    type: 'bank_document',
    label: 'bank / account document',
    keywords: [
      'bank',
      'account number',
      'account name',
      'branch',
      'sacco',
      'iban',
      'swift',
      'statement',
      'bankers',
      'cheque',
      'deposit',
      'kcb',
      'equity',
      'cooperative bank',
      'abs a',
      'ncba',
    ],
    minHits: 1,
  },
  {
    type: 'meeting_minutes',
    label: 'group meeting minutes',
    keywords: [
      'minutes',
      'meeting',
      'agenda',
      'present',
      'apologies',
      'resolution',
      'chairman',
      'chairperson',
      'secretary',
      'matters arising',
      'attendance',
    ],
    minHits: 1,
  },
  {
    type: 'member_list',
    label: 'list of members on certificate',
    keywords: [
      'list of members',
      'members list',
      'membership',
      'name',
      'id no',
      'id number',
      'national id',
      'telephone',
      'phone',
      'signature',
    ],
    minHits: 2,
  },
  {
    type: 'expression_of_interest',
    label: 'expression of interest',
    keywords: [
      'expression of interest',
      'eoi',
      'we hereby',
      'interested',
      'application for',
      'uwezo',
      'loan',
      'hereby apply',
    ],
    minHits: 1,
  },
  {
    type: 'generic_document',
    label: 'required supporting document',
    keywords: [],
    minHits: 0,
  },
];

const FIELD_TO_TYPE: Record<string, OcrDocType> = {
  // Majuu upload categories
  'group-certificate': 'group_certificate',
  'group-kra': 'kra_pin',
  'group-bank-template': 'bank_document',
  'expression-of-interest': 'expression_of_interest',
  'member-id': 'national_id',
  'member-passport': 'passport',
  'member-kra': 'kra_pin',
  'individual-document': 'generic_document',
  // Declared / chat defaults
  national_id: 'national_id',
  'national-id': 'national_id',
  id: 'national_id',
  kra_pin: 'kra_pin',
  'kra-pin': 'kra_pin',
  kra: 'kra_pin',
  passport: 'passport',
  // Loans group-data file columns
  groupregistrationcertificate: 'group_certificate',
  'group-registration-certificate': 'group_certificate',
  listofmembersoncertificate: 'member_list',
  'list-of-members-on-certificate': 'member_list',
  groupmeetingminutes: 'meeting_minutes',
  'group-meeting-minutes': 'meeting_minutes',
  groupcredithistory: 'bank_document',
  'group-credit-history': 'bank_document',
};

function normalizeKey(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
}

function camelToKebabLoose(raw: string): string {
  return String(raw || '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/_/g, '-');
}

/** Resolve expected OCR document type from field key, category, or declared type. */
export function resolveOcrDocType(fieldOrCategory: string): OcrDocType {
  const raw = String(fieldOrCategory || '').trim();
  if (!raw) return 'generic_document';
  const kebab = normalizeKey(raw);
  const camelFlat = raw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const fromCamel = camelToKebabLoose(raw);

  return (
    FIELD_TO_TYPE[kebab] ||
    FIELD_TO_TYPE[fromCamel] ||
    FIELD_TO_TYPE[camelFlat] ||
    (kebab.includes('kra')
      ? 'kra_pin'
      : kebab.includes('passport')
        ? 'passport'
        : kebab.includes('id') && !kebab.includes('valid')
          ? 'national_id'
          : kebab.includes('bank') || kebab.includes('statement')
            ? 'bank_document'
            : kebab.includes('minute')
              ? 'meeting_minutes'
              : kebab.includes('certificate') || kebab.includes('registration')
                ? 'group_certificate'
                : kebab.includes('member') && kebab.includes('list')
                  ? 'member_list'
                  : kebab.includes('interest') || kebab.includes('eoi')
                    ? 'expression_of_interest'
                    : 'generic_document')
  );
}

export function expectedDocLabel(type: OcrDocType): string {
  return PROFILES.find((p) => p.type === type)?.label || 'required document';
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractIdCandidates(text: string): string[] {
  const hits = new Set<string>();
  const re = /\b(\d{7,9})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) hits.add(m[1]);
  }
  return Array.from(hits).slice(0, 5);
}

function keywordHits(text: string, keywords: string[]): string[] {
  const n = normalizeText(text);
  return keywords.filter((k) => n.includes(k));
}

function scoreProfile(
  text: string,
  profile: DocProfile,
): { hits: string[]; score: number; match: boolean } {
  const hits = keywordHits(text, profile.keywords);
  let patternHit = false;
  if (profile.patterns) {
    for (const re of profile.patterns) {
      if (re.test(text.replace(/\s/g, ''))) {
        patternHit = true;
        break;
      }
    }
  }
  const hitCount = hits.length + (patternHit ? 1 : 0);
  const match = hitCount >= Math.max(1, profile.minHits);
  const score = Math.min(1, hitCount / Math.max(3, profile.minHits + 1));
  return { hits: patternHit ? [...hits, '(pattern)'] : hits, score, match };
}

function detectBestType(text: string): {
  type: OcrDocType | 'unknown';
  hits: string[];
  score: number;
} {
  let best: { type: OcrDocType | 'unknown'; hits: string[]; score: number } = {
    type: 'unknown',
    hits: [],
    score: 0,
  };
  for (const profile of PROFILES) {
    if (profile.type === 'generic_document') continue;
    const r = scoreProfile(text, profile);
    if (r.match && r.score > best.score) {
      best = { type: profile.type, hits: r.hits, score: r.score };
    }
  }
  return best;
}

/**
 * Score OCR text for a field’s expected document.
 * Mismatch → confidence capped at OCR_MISMATCH_CONFIDENCE (~20%), Capture locked.
 */
export function scoreKenyanDocumentOcr(opts: {
  text: string;
  tesseractConfidence: number; // 0–100
  declaredType: OcrDocType | string;
}): OcrScoreResult {
  const expectedType = resolveOcrDocType(String(opts.declaredType));
  const text = opts.text || '';
  const rawConfidence =
    Math.max(0, Math.min(100, opts.tesseractConfidence)) / 100;
  const idCandidates = extractIdCandidates(text);
  const overlayLines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12);

  const expectedProfile =
    PROFILES.find((p) => p.type === expectedType) ||
    PROFILES.find((p) => p.type === 'generic_document')!;

  const expectedScore = scoreProfile(text, expectedProfile);
  const detected = detectBestType(text);
  const looksLikeKenyanId = scoreProfile(
    text,
    PROFILES.find((p) => p.type === 'national_id')!,
  ).match;

  // Generic documents: any readable text with decent OCR is acceptable
  let looksLikeDeclaredType = false;
  if (expectedType === 'generic_document') {
    looksLikeDeclaredType = text.trim().length > 30 && rawConfidence >= 0.3;
  } else if (expectedType === 'national_id') {
    looksLikeDeclaredType =
      expectedScore.match || (looksLikeKenyanId && idCandidates.length >= 1);
  } else {
    looksLikeDeclaredType = expectedScore.match;
  }

  // Strong conflicting signal: detected another specific type with higher score
  const conflict =
    looksLikeDeclaredType === false &&
    detected.type !== 'unknown' &&
    detected.type !== expectedType &&
    detected.score >= 0.35;

  const keywordScore = expectedScore.score;
  const idBonus =
    idCandidates.length > 0 && expectedType === 'national_id' ? 0.12 : 0;

  let confidence = Math.min(
    1,
    rawConfidence * 0.5 +
      keywordScore * 0.4 +
      idBonus +
      (looksLikeDeclaredType ? 0.1 : 0),
  );

  if (!text.trim() || rawConfidence < 0.25) {
    return {
      confidence: Math.min(confidence, 0.35),
      rawConfidence,
      matchedKeywords: expectedScore.hits,
      idCandidates,
      expectedType,
      detectedType: detected.type,
      looksLikeKenyanId,
      looksLikeDeclaredType: false,
      pass: false,
      rejectReason:
        'Could not read enough text from this image. Hold the document steady in good light and try again.',
      overlayLines,
    };
  }

  if (!looksLikeDeclaredType || conflict) {
    confidence = OCR_MISMATCH_CONFIDENCE;
    const required = expectedDocLabel(expectedType);
    const got =
      detected.type !== 'unknown'
        ? expectedDocLabel(detected.type as OcrDocType)
        : 'a different or unreadable document';
    return {
      confidence,
      rawConfidence,
      matchedKeywords: expectedScore.hits,
      idCandidates,
      expectedType,
      detectedType: detected.type,
      looksLikeKenyanId,
      looksLikeDeclaredType: false,
      pass: false,
      rejectReason: `This field requires ${required}. Scan looks like ${got} (~${Math.round(confidence * 100)}%). Use the correct document.`,
      overlayLines,
    };
  }

  if (confidence < OCR_CAPTURE_THRESHOLD) {
    return {
      confidence,
      rawConfidence,
      matchedKeywords: expectedScore.hits,
      idCandidates,
      expectedType,
      detectedType: detected.type,
      looksLikeKenyanId,
      looksLikeDeclaredType: true,
      pass: false,
      rejectReason: `Document confidence too low (${Math.round(confidence * 100)}%) for ${expectedDocLabel(expectedType)}. Improve lighting or focus, then scan again.`,
      overlayLines,
    };
  }

  return {
    confidence,
    rawConfidence,
    matchedKeywords: expectedScore.hits,
    idCandidates,
    expectedType,
    detectedType: detected.type === 'unknown' ? expectedType : detected.type,
    looksLikeKenyanId,
    looksLikeDeclaredType: true,
    pass: true,
    overlayLines,
  };
}

type TesseractWorkerLike = {
  recognize: (
    image: HTMLCanvasElement | HTMLImageElement | File | Blob,
  ) => Promise<{ data: { text: string; confidence: number } }>;
  terminate: () => Promise<void>;
};

type TesseractGlobal = {
  createWorker: (langs?: string) => Promise<TesseractWorkerLike>;
};

let workerPromise: Promise<TesseractWorkerLike> | null = null;

function loadTesseractScript(): Promise<TesseractGlobal> {
  return new Promise((resolve, reject) => {
    const existing = (window as unknown as { Tesseract?: TesseractGlobal })
      .Tesseract;
    if (existing?.createWorker) {
      resolve(existing);
      return;
    }
    const prev = document.querySelector<HTMLScriptElement>(
      'script[data-uwezo-tesseract]',
    );
    if (prev) {
      prev.addEventListener('load', () => {
        const t = (window as unknown as { Tesseract?: TesseractGlobal })
          .Tesseract;
        if (t?.createWorker) resolve(t);
        else reject(new Error('OCR engine missing after load'));
      });
      prev.addEventListener('error', () =>
        reject(new Error('OCR script failed')),
      );
      return;
    }
    const s = document.createElement('script');
    s.src =
      'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    s.async = true;
    s.dataset.uwezoTesseract = '1';
    s.onload = () => {
      const t = (window as unknown as { Tesseract?: TesseractGlobal })
        .Tesseract;
      if (t?.createWorker) resolve(t);
      else reject(new Error('OCR engine missing after load'));
    };
    s.onerror = () => reject(new Error('Could not load OCR engine (network)'));
    document.head.appendChild(s);
  });
}

export async function getTesseractWorker(): Promise<TesseractWorkerLike> {
  if (typeof window === 'undefined') {
    throw new Error('OCR is only available in the browser');
  }
  if (!workerPromise) {
    workerPromise = (async () => {
      const Tesseract = await loadTesseractScript();
      return Tesseract.createWorker('eng');
    })();
  }
  return workerPromise;
}

export async function runClientOcr(
  source: HTMLCanvasElement | HTMLImageElement | File | Blob,
  declaredType: OcrDocType | string,
): Promise<OcrScoreResult & { text: string }> {
  const worker = await getTesseractWorker();
  const { data } = await worker.recognize(source);
  const scored = scoreKenyanDocumentOcr({
    text: data.text || '',
    tesseractConfidence: data.confidence || 0,
    declaredType,
  });
  return { ...scored, text: data.text || '' };
}

/** Map OCR type → authenticity declaredType used by server heuristics. */
export function toAuthenticityDeclaredType(
  type: OcrDocType,
): 'national_id' | 'kra_pin' | 'passport' | 'other' {
  if (type === 'national_id') return 'national_id';
  if (type === 'kra_pin') return 'kra_pin';
  if (type === 'passport') return 'passport';
  return 'other';
}
