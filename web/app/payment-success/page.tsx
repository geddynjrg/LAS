import { getPaymentTransactionByBillRef } from '@/lib/data/payment-transaction';
import { confirmPaymentByBillRef } from '@/lib/payments/pesaflow-ipn';
import { IconCircleCheck, IconClock } from '@tabler/icons-react';
import Link from 'next/link';

interface PaymentSuccessPageProps {
  searchParams: Promise<{
    applicationId?: string;
    amount?: string;
    amountExpected?: string;
    billRefNumber?: string;
  }>;
}

function formatKes(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
}

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const params = await searchParams;
  const applicationId = params.applicationId ?? '';
  const amountRaw = params.amount ?? params.amountExpected ?? '0';
  const amount = Number.parseFloat(amountRaw);
  const billRefNumber = params.billRefNumber ?? '';

  let smsNote: string | null = null;
  let confirmed = false;
  let pending = false;

  if (billRefNumber) {
    const confirmation = await confirmPaymentByBillRef(billRefNumber);
    confirmed = confirmation.success;
    pending = !confirmation.success && !confirmation.error?.includes('not found');

    const transaction = await getPaymentTransactionByBillRef(billRefNumber);

    if (confirmation.success) {
      smsNote =
        transaction?.smsSentAt
          ? 'A confirmation SMS has been sent to your group members.'
          : 'Payment recorded. Member SMS notifications will follow shortly.';
    } else if (pending) {
      smsNote =
        'Your payment is being confirmed. Member SMS will be sent once Pesaflow verifies the transaction.';
    } else {
      smsNote = confirmation.error ?? null;
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      {confirmed ? (
        <IconCircleCheck className="mb-4 h-16 w-16 text-green-600" stroke={1.5} />
      ) : (
        <IconClock className="mb-4 h-16 w-16 text-amber-500" stroke={1.5} />
      )}

      <h1 className="typo-h2 mb-2">
        {confirmed ? 'Payment successful' : 'Payment received'}
      </h1>
      <p className="mb-6 text-neutral-600">
        {confirmed
          ? 'Thank you. Your loan repayment has been received and confirmed.'
          : 'Thank you. We are confirming your payment with Pesaflow.'}
      </p>

      {(applicationId || billRefNumber) ? (
        <div className="mb-6 w-full rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left text-sm">
          {applicationId ? (
            <p>
              <span className="text-neutral-500">Application:</span>{' '}
              {applicationId}
            </p>
          ) : null}
          {Number.isFinite(amount) && amount > 0 ? (
            <p className="mt-2">
              <span className="text-neutral-500">Amount paid:</span>{' '}
              {formatKes(amount)}
            </p>
          ) : null}
          {billRefNumber ? (
            <p className="mt-2">
              <span className="text-neutral-500">Reference:</span>{' '}
              {billRefNumber}
            </p>
          ) : null}
        </div>
      ) : null}

      {smsNote ? (
        <p className="mb-8 text-sm text-neutral-600">{smsNote}</p>
      ) : null}

      <Link
        href="/dashboard"
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
