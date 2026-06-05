import { generateCheckoutSecureHash } from '@/lib/payments/pesaflow-hash';
import { getPesaflowConfig, getPublicAppBaseUrl } from '@/lib/payments/pesaflow.config';
import type { PesaflowCheckoutPayload } from '@/lib/payments/pesaflow.types';

export function normalizeKenyanMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('254')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `254${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `254${digits}`;
  }

  return digits;
}

export function formatPesaflowAmount(amount: number): string {
  return amount.toFixed(2);
}

export function generateBillRefNumber(applicationId: string): string {
  const suffix = Math.random().toString(36).slice(2, 10).toUpperCase();
  const compactAppId = applicationId.replace(/[^A-Z0-9]/gi, '').slice(-8);
  return `WF-${Date.now()}-${compactAppId}-${suffix}`;
}

export function buildPesaflowCheckoutPayload(input: {
  applicationId: string;
  amount: number;
  billRefNumber: string;
  clientName: string;
  clientMSISDN: string;
  clientIDNumber: string;
  clientEmail: string;
  billDesc?: string;
}): PesaflowCheckoutPayload | null {
  const config = getPesaflowConfig();
  if (!config) {
    return null;
  }

  const baseUrl = getPublicAppBaseUrl();
  const amountExpected = formatPesaflowAmount(input.amount);
  const billDesc = input.billDesc || config.billDesc;

  const callbackParams = new URLSearchParams({
    applicationId: input.applicationId,
    amount: amountExpected,
    billRefNumber: input.billRefNumber,
  });

  const baseFields = {
    apiClientID: config.apiClientId,
    serviceID: config.serviceId,
    billDesc,
    currency: 'KES',
    billRefNumber: input.billRefNumber,
    clientMSISDN: normalizeKenyanMsisdn(input.clientMSISDN),
    clientName: input.clientName,
    clientIDNumber: input.clientIDNumber,
    clientEmail: input.clientEmail,
    callBackURLOnSuccess: `${baseUrl}/payment-success?${callbackParams.toString()}`,
    amountExpected,
    notificationURL: `${baseUrl}/api/payments/pesaflow/callback`,
    PictureURL: '',
    format: 'json',
  };

  const secureHash = generateCheckoutSecureHash(
    {
      apiClientID: baseFields.apiClientID,
      amountExpected: baseFields.amountExpected,
      serviceID: baseFields.serviceID,
      clientIDNumber: baseFields.clientIDNumber,
      currency: baseFields.currency,
      billRefNumber: baseFields.billRefNumber,
      billDesc: baseFields.billDesc,
      clientName: baseFields.clientName,
    },
    config.hmacKey,
    config.hmacSecret,
  );

  return {
    ...baseFields,
    secureHash,
    ...(config.sendStk ? { sendSTK: 'true' } : {}),
  };
}

export function getPesaflowCheckoutUrl(): string | null {
  return getPesaflowConfig()?.checkoutUrl ?? null;
}
