'use client';

import { checkSoftDuplicatesAction } from '@/lib/soft-duplicate-action';
import type { SoftDuplicateResult } from '@/lib/soft-duplicate-check';
import { type FC, useEffect, useState } from 'react';

export const SoftDuplicateBanner: FC<{
  phone?: string;
  nationalId?: string;
  applicationId?: string;
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
  enabled?: boolean;
}> = ({
  phone,
  nationalId,
  applicationId,
  acknowledged,
  onAcknowledgedChange,
  enabled = true,
}) => {
  const [result, setResult] = useState<SoftDuplicateResult | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setResult(null);
      return;
    }

    const phoneValue = (phone ?? '').trim();
    const idValue = (nationalId ?? '').trim();
    if (phoneValue.length < 9 && idValue.length < 5) {
      setResult(null);
      return;
    }

    const handle = window.setTimeout(() => {
      setChecking(true);
      void checkSoftDuplicatesAction({
        phone: phoneValue,
        nationalId: idValue,
        applicationId,
      })
        .then((data) => {
          setResult(data);
          if (!data.phoneDuplicate && !data.nationalIdDuplicate) {
            onAcknowledgedChange(false);
          }
        })
        .catch(() => setResult(null))
        .finally(() => setChecking(false));
    }, 450);

    return () => window.clearTimeout(handle);
  }, [phone, nationalId, applicationId, enabled, onAcknowledgedChange]);

  const hasDuplicate =
    Boolean(result?.phoneDuplicate) || Boolean(result?.nationalIdDuplicate);

  if (!hasDuplicate) {
    return checking ? (
      <p className="mb-2 text-xs text-muted-foreground">
        Checking for duplicate contacts…
      </p>
    ) : null;
  }

  return (
    <div
      role="status"
      className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
    >
      <p className="font-medium">Possible duplicate on another application</p>
      <p className="mt-1 text-xs">{result?.message}</p>
      <label className="mt-2 flex items-start gap-2 text-xs">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={acknowledged}
          onChange={(e) => onAcknowledgedChange(e.target.checked)}
        />
        <span>
          I understand this contact may already appear on another in-progress
          application and want to continue.
        </span>
      </label>
    </div>
  );
};
