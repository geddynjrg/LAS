// initiate m-pesa payment

import { getTranslations } from "next-intl/server";

import { Container } from "@workspace/ui/components/container";

import { InitiatePaymentForm } from "@/app/apply/[id]/payment/mpesa/initiate-payment-form";

export interface PaymentPageProps {
  params: Promise<{ id: string }>;
}

export default async function MpesaPaymentPage({ params }: PaymentPageProps) {
  const { id } = await params;
  const t = await getTranslations("MpesaPayment");

  return (
    <Container className="my-auto mb-8 max-w-2xl space-y-4">
      <h2 className="typo-h3 text-center">{t("title")}</h2>
      <p className="text-center">{t("description")}</p>
      <InitiatePaymentForm id={id} />
    </Container>
  );
}
