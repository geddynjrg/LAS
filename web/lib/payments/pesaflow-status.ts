import {
  generateStatusSecureHash,
  generateStatusSecureHashCandidates,
} from '@/lib/payments/pesaflow-hash';
import { getPesaflowConfig } from '@/lib/payments/pesaflow.config';
import type { PesaflowStatusResponse } from '@/lib/payments/pesaflow.types';

async function fetchPesaflowStatus(
  billRefNumber: string,
  secureHash: string,
): Promise<PesaflowStatusResponse | null> {
  const config = getPesaflowConfig();
  if (!config) {
    return null;
  }

  const url = new URL(config.statusUrl);
  url.searchParams.set('api_client_id', config.apiClientId);
  url.searchParams.set('ref_no', billRefNumber);
  url.searchParams.set('secure_hash', secureHash);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const data = (await response.json().catch(() => ({}))) as PesaflowStatusResponse;

    if (!response.ok) {
      console.warn('[Pesaflow] Status query failed:', response.status, data);
    }

    return data;
  } catch (error) {
    console.error('[Pesaflow] Status query error:', error);
    return null;
  }
}

export async function queryPesaflowPaymentStatus(
  billRefNumber: string,
): Promise<PesaflowStatusResponse | null> {
  const config = getPesaflowConfig();
  if (!config) {
    return null;
  }

  const hashCandidates = generateStatusSecureHashCandidates(
    config.apiClientId,
    billRefNumber,
    config.hmacKey,
  );

  let lastResponse: PesaflowStatusResponse | null = null;

  for (const secureHash of hashCandidates) {
    const response = await fetchPesaflowStatus(billRefNumber, secureHash);
    lastResponse = response;

    if (!response) {
      continue;
    }

    const queryStatus = String(response.query_status ?? '').toLowerCase();
    if (queryStatus === 'unauthorized') {
      continue;
    }

    return response;
  }

  return lastResponse;
}

export function isPesaflowStatusPaid(status: PesaflowStatusResponse | null): boolean {
  if (!status) {
    return false;
  }

  const queryStatus = String(status.query_status ?? '').toLowerCase();
  if (
    queryStatus === 'unauthorized' ||
    queryStatus.includes('invalid invoice') ||
    queryStatus.includes('invalid transaction')
  ) {
    return false;
  }

  const paymentStatus = String(status.status ?? '').toLowerCase();
  return (
    paymentStatus.includes('paid') ||
    paymentStatus.includes('success') ||
    paymentStatus.includes('complete') ||
    queryStatus.includes('paid') ||
    queryStatus.includes('success')
  );
}

export function isPesaflowStatusUnderpaid(status: PesaflowStatusResponse | null): boolean {
  if (!status) {
    return false;
  }

  const queryStatus = String(status.query_status ?? '').toLowerCase();
  return queryStatus.includes('invalid transaction amount');
}

export function extractStatusPaidAmount(
  status: PesaflowStatusResponse | null,
  fallback: number,
): number {
  if (!status) {
    return fallback;
  }

  const candidates = [
    status.amount_paid,
    status.last_payment_amount,
    status.invoice_amount,
    status.amount,
  ];

  for (const value of candidates) {
    const amount = Number.parseFloat(String(value ?? '').replace(/,/g, ''));
    if (Number.isFinite(amount) && amount > 0) {
      return amount;
    }
  }

  return fallback;
}

/** @deprecated use generateStatusSecureHashCandidates */
export { generateStatusSecureHash };
