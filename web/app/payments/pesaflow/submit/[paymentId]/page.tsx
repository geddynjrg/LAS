import { PesaflowIframeCheckout } from '@/components/pesaflow-iframe-checkout';
import { getPaymentCheckoutSession } from '@/lib/payments/pesaflow.service';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface SubmitPageProps {
  params: Promise<{ paymentId: string }>;
}

export default async function PesaflowSubmitPage({ params }: SubmitPageProps) {
  const { paymentId } = await params;
  const session = await getPaymentCheckoutSession(paymentId);

  if (!session) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="typo-h2 mb-2">Payment session not found</h1>
        <p className="mb-6 text-neutral-600">
          This payment link is invalid or has expired.
        </p>
        <Link href="/dashboard" className="text-primary underline">
          Back to dashboard
        </Link>
      </main>
    );
  }

  if (session.status === 'COMPLETED') {
    redirect(
      `/payment-success?applicationId=${encodeURIComponent(session.applicationId)}&amount=${encodeURIComponent(String(session.amountExpected))}&billRefNumber=${encodeURIComponent(session.billRefNumber)}`,
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <PesaflowIframeCheckout
        invoiceLink={session.invoiceLink}
        checkoutUrl={session.checkoutUrl}
        fields={session.payload}
      />
    </main>
  );
}
