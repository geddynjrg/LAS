/**
 * Client-side Kenyan document OCR scoring (assistive).
 * Used to gate Capture before chatbot upload.
 */

export type OcrDocType = 'national_id' | 'kra_pin' | 'passport' | 'other';

export type OcrScoreResult = {
  confidence: number; // 0–1 combined OCR + keyword score
  rawConfidence: number; // tesseract mean confidence 0–100 → normalized
  matchedKeywords: string[];
  idCandidates: string[];
  looksLikeKenyanId: boolean;
  looksLikeDeclaredType: boolean;
  pass: boolean;
  rejectReason?: string;
  overlayLines: string[];
};

const ID_KEYWORDS = [
  'republic of kenya',
  'national identity',
  'identity card',
  'serial number',
  'id number',
  'date of birth',
  'full names',
  'sex',
  'district',
];

const KRA_KEYWORDS = [
  'kenya revenue',
  'kra',
  'pin certificate',
  'taxpayer',
  'personal identification number',
];

const PASSPORT_KEYWORDS = [
  'passport',
  'immigration',
  'republic of kenya',
  'nationality',
  'date of expiry',
];

/** Minimum combined confidence to enable Capture. */
export const OCR_CAPTURE_THRESHOLD = 0.58;

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

export function scoreKenyanDocumentOcr(opts: {
  text: string;
  tesseractConfidence: number; // 0–100
  declaredType: OcrDocType;
}): OcrScoreResult {
  const text = opts.text || '';
  const rawConfidence =
    Math.max(0, Math.min(100, opts.tesseractConfidence)) / 100;
  const idCandidates = extractIdCandidates(text);
  const idHits = keywordHits(text, ID_KEYWORDS);
  const kraHits = keywordHits(text, KRA_KEYWORDS);
  const passportHits = keywordHits(text, PASSPORT_KEYWORDS);

  const looksLikeKenyanId =
    idHits.length >= 2 ||
    (idHits.length >= 1 && idCandidates.length >= 1) ||
    (normalizeText(text).includes('republic of kenya') &&
      idCandidates.length >= 1);

  let declaredHits: string[] = [];
  let looksLikeDeclaredType = false;
  if (opts.declaredType === 'national_id') {
    declaredHits = idHits;
    looksLikeDeclaredType = looksLikeKenyanId;
  } else if (opts.declaredType === 'kra_pin') {
    declaredHits = kraHits;
    looksLikeDeclaredType =
      kraHits.length >= 1 || /A\d{9}[A-Z]/i.test(text.replace(/\s/g, ''));
  } else if (opts.declaredType === 'passport') {
    declaredHits = passportHits;
    looksLikeDeclaredType = passportHits.length >= 1;
  } else {
    declaredHits = [...idHits, ...kraHits, ...passportHits];
    looksLikeDeclaredType =
      looksLikeKenyanId ||
      kraHits.length > 0 ||
      passportHits.length > 0 ||
      text.trim().length > 40;
  }

  const keywordScore = Math.min(1, declaredHits.length / 3);
  const idBonus =
    idCandidates.length > 0 && opts.declaredType === 'national_id' ? 0.12 : 0;
  const confidence = Math.min(
    1,
    rawConfidence * 0.55 +
      keywordScore * 0.35 +
      idBonus +
      (looksLikeDeclaredType ? 0.08 : 0),
  );

  const overlayLines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12);

  if (!text.trim() || rawConfidence < 0.25) {
    return {
      confidence,
      rawConfidence,
      matchedKeywords: declaredHits,
      idCandidates,
      looksLikeKenyanId,
      looksLikeDeclaredType,
      pass: false,
      rejectReason:
        'Could not read enough text from this image. Hold the document steady in good light and try again.',
      overlayLines,
    };
  }

  if (!looksLikeDeclaredType) {
    const expected =
      opts.declaredType === 'national_id'
        ? 'a Kenyan National ID'
        : opts.declaredType === 'kra_pin'
          ? 'a KRA PIN certificate'
          : opts.declaredType === 'passport'
            ? 'a passport biodata page'
            : 'the required document';
    return {
      confidence,
      rawConfidence,
      matchedKeywords: declaredHits,
      idCandidates,
      looksLikeKenyanId,
      looksLikeDeclaredType,
      pass: false,
      rejectReason: `This does not look like ${expected}. Please use the correct document.`,
      overlayLines,
    };
  }

  if (confidence < OCR_CAPTURE_THRESHOLD) {
    return {
      confidence,
      rawConfidence,
      matchedKeywords: declaredHits,
      idCandidates,
      looksLikeKenyanId,
      looksLikeDeclaredType,
      pass: false,
      rejectReason: `Document confidence too low (${Math.round(confidence * 100)}%). Improve lighting or focus, then scan again.`,
      overlayLines,
    };
  }

  return {
    confidence,
    rawConfidence,
    matchedKeywords: declaredHits,
    idCandidates,
    looksLikeKenyanId,
    looksLikeDeclaredType,
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

/** Lazy-load tesseract.js from CDN (no package.json change required). */
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
  declaredType: OcrDocType,
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
