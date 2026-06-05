'use client';

import { useEffect, useRef } from 'react';

interface PesaflowCheckoutFormProps {
  action: string;
  fields: Record<string, string>;
}

export function PesaflowCheckoutForm({
  action,
  fields,
}: PesaflowCheckoutFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.submit();
  }, []);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <h1 className="typo-h3 mb-2">Redirecting to Pesaflow</h1>
      <p className="mb-6 text-sm text-neutral-600">
        Please wait while we connect you to the secure payment page…
      </p>
      <form ref={formRef} method="POST" action={action}>
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm text-white"
        >
          Continue to payment
        </button>
      </form>
    </div>
  );
}
