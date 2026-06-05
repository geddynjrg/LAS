import type {
  PesaflowCheckoutPayload,
  PesaflowInvoiceResponse,
} from '@/lib/payments/pesaflow.types';

function parseInvoiceResponse(raw: string): PesaflowInvoiceResponse {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Pesaflow did not return a valid invoice response');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('invoice_link' in parsed) ||
    typeof (parsed as PesaflowInvoiceResponse).invoice_link !== 'string'
  ) {
    throw new Error('Pesaflow invoice response is missing invoice_link');
  }

  return parsed as PesaflowInvoiceResponse;
}

export async function requestPesaflowInvoice(
  checkoutUrl: string,
  payload: PesaflowCheckoutPayload,
): Promise<PesaflowInvoiceResponse> {
  const body = new URLSearchParams(
    Object.entries(payload).reduce<Record<string, string>>((fields, [key, value]) => {
      if (value !== undefined && value !== null) {
        fields[key] = String(value);
      }
      return fields;
    }, {}),
  );

  const response = await fetch(checkoutUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      `Pesaflow invoice request failed (${response.status}): ${raw.slice(0, 200)}`,
    );
  }

  return parseInvoiceResponse(raw);
}

export function extractStoredInvoiceLink(
  checkoutPayload: unknown,
): string | null {
  if (!checkoutPayload || typeof checkoutPayload !== 'object') {
    return null;
  }

  const link = (checkoutPayload as Record<string, unknown>)._invoiceLink;
  return typeof link === 'string' && link.length > 0 ? link : null;
}
