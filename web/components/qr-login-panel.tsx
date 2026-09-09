'use client';

import { Button } from '@workspace/ui/components/button';
import { type FC, useCallback, useEffect, useRef, useState } from 'react';

type StartResponse = {
  ok?: boolean;
  error?: string;
  challengeId?: string;
  expiresAt?: number;
  expiresIn?: number;
  pollIntervalMs?: number;
  qrPayload?: string;
  qrImageUrl?: string;
  message?: string;
};

type StatusResponse = {
  ok?: boolean;
  status?: string;
  error?: string;
  message?: string;
};

export type QrLoginPanelProps = {
  redirectTo?: string;
  source?: 'web' | 'chat';
  onReady?: () => void;
  className?: string;
};

export const QrLoginPanel: FC<QrLoginPanelProps> = ({
  redirectTo = '/dashboard',
  source = 'web',
  onReady,
  className,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [expiresIn, setExpiresIn] = useState(0);
  const pollRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const start = useCallback(async () => {
    setBusy(true);
    setError('');
    setMessage('');
    clearTimers();
    try {
      const res = await fetch('/api/auth/qr/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      const data = (await res.json()) as StartResponse;
      if (!res.ok || !data.ok || !data.challengeId || !data.qrImageUrl) {
        setError(data.error || 'Could not start QR login.');
        setBusy(false);
        return;
      }
      setChallengeId(data.challengeId);
      setQrImageUrl(data.qrImageUrl);
      setExpiresIn(data.expiresIn || 90);
      setMessage(
        data.message ||
          'Scan with the Uwezo Fund app, verify phone/email, then confirm.',
      );

      const pollMs = data.pollIntervalMs || 2000;
      pollRef.current = window.setInterval(async () => {
        try {
          const st = await fetch(
            `/api/auth/qr/status?challengeId=${encodeURIComponent(data.challengeId!)}`,
          );
          const body = (await st.json()) as StatusResponse;
          if (body.status === 'ready') {
            clearTimers();
            setMessage(body.message || 'Signed in. Redirecting…');
            onReady?.();
            window.location.href = redirectTo;
            return;
          }
          if (body.status === 'expired' || body.status === 'consumed') {
            clearTimers();
            setError(body.message || body.error || 'QR expired. Start again.');
            setChallengeId('');
            setQrImageUrl('');
          }
          if (!st.ok && body.error) {
            clearTimers();
            setError(body.error);
          }
        } catch {
          // ignore transient poll errors
        }
      }, pollMs);

      tickRef.current = window.setInterval(() => {
        setExpiresIn((v) => {
          if (v <= 1) {
            clearTimers();
            setError('QR expired. Generate a new code.');
            setChallengeId('');
            setQrImageUrl('');
            return 0;
          }
          return v - 1;
        });
      }, 1000);
    } catch {
      setError('Could not start QR login.');
    } finally {
      setBusy(false);
    }
  }, [clearTimers, onReady, redirectTo, source]);

  return (
    <div
      className={
        className ||
        'space-y-3 rounded-md border border-sky-200 bg-sky-50/60 p-4'
      }
    >
      <div>
        <h3 className="text-sm font-semibold text-sky-950">Login with App QR</h3>
        <p className="mt-1 text-xs text-sky-900/80">
          Option B: scan on your phone, verify with OTP or email, then this
          browser signs in automatically. Code expires in about 90 seconds.
        </p>
      </div>

      {qrImageUrl ? (
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt="QR code for Uwezo Fund app login"
            width={220}
            height={220}
            className="rounded bg-white p-2 shadow-sm"
          />
          <p className="text-xs text-neutral-600">
            Waiting for confirmation… {expiresIn}s left
          </p>
          <p className="text-[11px] text-neutral-500 break-all max-w-full">
            Challenge: {challengeId.slice(0, 8)}…
          </p>
        </div>
      ) : null}

      {message ? (
        <p className="text-xs text-emerald-800" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="w-full"
        disabled={busy}
        onClick={() => void start()}
      >
        {qrImageUrl ? 'Generate new QR' : 'Show App QR'}
      </Button>
    </div>
  );
};
