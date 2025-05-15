// initiate m-pesa payment

import { Container } from "@workspace/ui/components/container";

import { InitiatePaymentForm } from "@/app/apply/[id]/payment/mpesa/initiate-payment-form";

export interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplyPage({ params }: PaymentPageProps) {
  const { id } = await params;

  return (
    <Container className="my-auto mb-8 max-w-2xl space-y-4">
      <h2 className="typo-h3 text-center">M-PESA payment</h2>
      <p className="text-center">
        Please enter your phone number to proceed with the payment
      </p>
      <InitiatePaymentForm id={id} />
    </Container>
  );
}
