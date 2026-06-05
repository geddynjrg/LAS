'use client';

import { useEffect, useId, useRef } from 'react';

interface PesaflowIframeCheckoutProps {
  invoiceLink?: string | null;
  checkoutUrl?: string;
  fields?: Record<string, string>;
}

const IFRAME_NAME = 'pesaflow-checkout-frame';

export function PesaflowIframeCheckout({
  invoiceLink,
  checkoutUrl,
  fields,
}: PesaflowIframeCheckoutProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();

  useEffect(() => {
    if (invoiceLink || !checkoutUrl || !fields) {
      return;
    }

    formRef.current?.submit();
  }, [checkoutUrl, fields, invoiceLink]);

  if (invoiceLink) {
    return (
      <div className="space-y-3">
        <iframe
          title="Pesaflow payment"
          src={invoiceLink}
          name={IFRAME_NAME}
          className="h-[560px] w-full rounded-lg border border-neutral-200 bg-white"
          allow="payment *"
        />
      </div>
    );
  }

  if (!checkoutUrl || !fields) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Payment checkout details are unavailable. Please close this dialog and try
        again.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        Loading secure Pesaflow checkout…
      </p>
      <iframe
        title="Pesaflow payment"
        name={IFRAME_NAME}
        className="h-[560px] w-full rounded-lg border border-neutral-200 bg-white"
        allow="payment *"
      />
      <form
        ref={formRef}
        id={formId}
        method="POST"
        action={checkoutUrl}
        target={IFRAME_NAME}
        className="hidden"
      >
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
    </div>
  );
}
