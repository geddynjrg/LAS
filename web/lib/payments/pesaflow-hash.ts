import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Pesaflow iframe checkout secureHash (Appendix I).
 * data = apiClientID + amount + serviceID + clientIDNumber + currency
 *        + billRefNumber + billDesc + clientName + secret
 * hash = base64( hex( hmac_sha256(data, key) ) )
 */
export function generateCheckoutSecureHash(
  fields: {
    apiClientID: string;
    amountExpected: string;
    serviceID: string;
    clientIDNumber: string;
    currency: string;
    billRefNumber: string;
    billDesc: string;
    clientName: string;
  },
  key: string,
  secret: string,
): string {
  const dataString =
    fields.apiClientID +
    fields.amountExpected +
    fields.serviceID +
    fields.clientIDNumber +
    fields.currency +
    fields.billRefNumber +
    fields.billDesc +
    fields.clientName +
    secret;

  return encodeHmacSha256HexToBase64(dataString, key);
}

/**
 * Pesaflow payment status query secure_hash.
 * data = api_client_id + ref_no
 */
export function generateStatusSecureHash(
  apiClientId: string,
  refNo: string,
  key: string,
): string {
  return encodeHmacSha256HexToBase64(apiClientId + refNo, key);
}

function encodeHmacSha256HexToBase64(dataString: string, key: string): string {
  const hex = createHmac('sha256', key)
    .update(dataString, 'utf8')
    .digest('hex');

  return Buffer.from(hex, 'utf8').toString('base64');
}

function encodeHmacSha256RawToBase64(dataString: string, key: string): string {
  return createHmac('sha256', key)
    .update(dataString, 'utf8')
    .digest('base64');
}

export function generateStatusSecureHashCandidates(
  apiClientId: string,
  refNo: string,
  key: string,
): string[] {
  const dataString = apiClientId + refNo;

  return [
    encodeHmacSha256RawToBase64(dataString, key),
    generateStatusSecureHash(apiClientId, refNo, key),
  ];
}

/**
 * Verify Pesaflow IPN token_hash when present.
 * Tries status-query style hashes and a payment-field composite.
 */
export function verifyPesaflowIpnTokenHash(
  tokenHash: string,
  fields: {
    apiClientId: string;
    clientInvoiceRef: string;
    paymentReference?: string;
    lastPaymentAmount?: string;
    currency?: string;
  },
  key: string,
  secret: string,
): boolean {
  const provided = tokenHash.trim();
  if (!provided) {
    return false;
  }

  const candidates = new Set<string>([
    ...generateStatusSecureHashCandidates(
      fields.apiClientId,
      fields.clientInvoiceRef,
      key,
    ),
  ]);

  if (fields.paymentReference) {
    candidates.add(
      encodeHmacSha256HexToBase64(
        fields.clientInvoiceRef +
          fields.paymentReference +
          (fields.lastPaymentAmount ?? '') +
          secret,
        key,
      ),
    );
  }

  for (const candidate of candidates) {
    if (safeCompareHash(provided, candidate)) {
      return true;
    }
  }

  return false;
}

function safeCompareHash(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}
