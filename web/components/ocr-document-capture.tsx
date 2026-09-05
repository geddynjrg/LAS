'use client';

import {
  OCR_CAPTURE_THRESHOLD,
  type OcrDocType,
  type OcrScoreResult,
  expectedDocLabel,
  resolveOcrDocType,
  runClientOcr,
} from '@/lib/kenyan-id-ocr';
import { Button } from '@workspace/ui/components/button';
import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type OcrCaptureResult = {
  file: File;
  ocr: OcrScoreResult & { text: string };
};

type Props = {
  /** Field key, upload category, or declared type — resolved to expected doc. */
  declaredType: OcrDocType | string;
  label?: string;
  onCaptured: (result: OcrCaptureResult) => void;
  onCancel?: () => void;
};

/**
 * Camera / file preview with OCR overlay. Capture stays disabled until
 * confidence is high for the *expected* document type for this field.
 */
export const OcrDocumentCapture: FC<Props> = ({
  declaredType,
  label,
  onCaptured,
  onCancel,
}) => {
  const expectedType = useMemo(
    () => resolveOcrDocType(String(declaredType)),
    [declaredType],
  );
  const expectedLabel = label || expectedDocLabel(expectedType);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<
    (OcrScoreResult & { text: string }) | null
  >(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        /* camera optional */
      }
    })();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  const drawOverlay = useCallback((lines: string[], pass: boolean) => {
    const overlay = overlayRef.current;
    const video = videoRef.current;
    if (!overlay) return;
    const w = video?.videoWidth || overlay.width || 320;
    const h = video?.videoHeight || overlay.height || 240;
    overlay.width = w;
    overlay.height = h;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = pass ? 'rgba(16, 185, 129, 0.35)' : 'rgba(2, 6, 23, 0.45)';
    ctx.fillRect(0, h - Math.min(h * 0.45, 18 + lines.length * 14), w, h);
    ctx.font = '12px monospace';
    ctx.fillStyle = pass ? '#ecfdf5' : '#fef3c7';
    lines.slice(0, 10).forEach((line, i) => {
      ctx.fillText(
        line.slice(0, 48),
        8,
        h - Math.min(h * 0.45, 18 + lines.length * 14) + 14 + i * 13,
      );
    });
  }, []);

  const grabFrameToCanvas = useCallback((): HTMLCanvasElement | null => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas;
  }, []);

  const scanSource = useCallback(
    async (source: HTMLCanvasElement | File) => {
      setScanning(true);
      setError(null);
      try {
        const result = await runClientOcr(source, expectedType);
        setScore(result);
        drawOverlay(result.overlayLines, result.pass);
        if (!result.pass) {
          setError(result.rejectReason || 'Document not accepted yet.');
        }
      } catch (e) {
        setScore(null);
        setError(
          e instanceof Error
            ? e.message
            : 'OCR failed. Check connection and try again.',
        );
      } finally {
        setScanning(false);
      }
    },
    [expectedType, drawOverlay],
  );

  const onScanCamera = useCallback(async () => {
    const frame = grabFrameToCanvas();
    if (!frame) {
      setError('Camera not ready. Use Choose photo instead.');
      return;
    }
    await scanSource(frame);
  }, [grabFrameToCanvas, scanSource]);

  const onFile = useCallback(
    async (file: File) => {
      setPreviewUrl(URL.createObjectURL(file));
      await scanSource(file);
    },
    [scanSource],
  );

  const onCapture = useCallback(async () => {
    if (!score?.pass) return;
    setScanning(true);
    try {
      let file: File | null = null;
      const frame = grabFrameToCanvas();
      if (frame) {
        const blob = await new Promise<Blob | null>((resolve) =>
          frame.toBlob(resolve, 'image/jpeg', 0.92),
        );
        if (blob) {
          file = new File([blob], `${expectedType}-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
        }
      }
      if (!file && fileInputRef.current?.files?.[0]) {
        file = fileInputRef.current.files[0];
      }
      if (!file) {
        setError('Nothing to capture. Scan a frame or choose a photo first.');
        return;
      }
      const finalScore = await runClientOcr(file, expectedType);
      if (!finalScore.pass) {
        setScore(finalScore);
        setError(finalScore.rejectReason || 'Capture rejected.');
        return;
      }
      stopCamera();
      onCaptured({ file, ocr: finalScore });
    } finally {
      setScanning(false);
    }
  }, [score, grabFrameToCanvas, expectedType, onCaptured, stopCamera]);

  const canCapture = Boolean(score?.pass) && !scanning;
  const pct = score ? Math.round(score.confidence * 100) : 0;

  return (
    <div className="space-y-2 rounded-md border border-sky-200 bg-sky-50/80 p-2 text-xs">
      <p className="font-medium text-sky-950">
        Expected: {expectedLabel} — Capture unlocks at ≥
        {Math.round(OCR_CAPTURE_THRESHOLD * 100)}% for this document type
      </p>
      <div className="relative overflow-hidden rounded bg-black">
        {previewUrl && !streamRef.current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-48 w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            className="max-h-48 w-full object-contain"
            playsInline
            muted
          />
        )}
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="text-xs"
          disabled={scanning}
          onClick={() => void onScanCamera()}
        >
          {scanning ? 'Scanning…' : 'Scan frame'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="text-xs"
          disabled={scanning}
          onClick={() => fileInputRef.current?.click()}
        >
          Choose photo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          size="sm"
          className="text-xs"
          disabled={!canCapture}
          onClick={() => void onCapture()}
        >
          Capture {score?.pass ? `(${pct}%)` : '(locked)'}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
      {score ? (
        <p className={score.pass ? 'text-emerald-800' : 'text-amber-800'}>
          Confidence {pct}%
          {score.detectedType && score.detectedType !== 'unknown'
            ? ` · detected: ${expectedDocLabel(score.detectedType as OcrDocType)}`
            : ''}
          {score.matchedKeywords.length
            ? ` · matched: ${score.matchedKeywords.slice(0, 3).join(', ')}`
            : ''}
        </p>
      ) : null}
      {error ? <p className="text-red-700">{error}</p> : null}
    </div>
  );
};
