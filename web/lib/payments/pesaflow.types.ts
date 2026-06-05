export interface PesaflowPaymentRequest {
  applicationId: string;
  amount: number;
  currency: 'KES';
  payerPhone?: string;
  payerEmail?: string;
  payerName?: string;
  payerIdNumber?: string;
  description?: string;
}

export interface PesaflowCheckoutPayload {
  apiClientID: string;
  serviceID: string;
  billDesc: string;
  currency: string;
  billRefNumber: string;
  clientMSISDN: string;
  clientName: string;
  clientIDNumber: string;
  clientEmail: string;
  callBackURLOnSuccess: string;
  amountExpected: string;
  notificationURL: string;
  secureHash: string;
  PictureURL: string;
  format: string;
  sendSTK?: string;
}

export interface PesaflowPaymentSession {
  paymentId: string;
  billRefNumber: string;
  submitPath: string;
  status: 'pending' | 'ready' | 'unavailable';
  message?: string;
}

export interface PesaflowPaymentResult {
  success: boolean;
  configured?: boolean;
  paymentId?: string;
  billRefNumber?: string;
  invoiceNumber?: string;
  invoiceLink?: string;
  checkoutUrl?: string;
  checkoutPayload?: Record<string, string>;
  submitPath?: string;
  error?: string;
}

export interface PesaflowInvoiceResponse {
  invoice_number: string;
  invoice_link: string;
  commission?: string;
  amount_net?: string;
  amount_expected?: string;
}

export interface PesaflowIpnPayload {
  payment_channel?: string;
  client_invoice_ref?: string;
  payment_reference?: string;
  currency?: string;
  amount_paid?: string | number;
  invoice_amount?: string | number;
  status?: string;
  invoice_number?: string;
  payment_date?: string;
  token_hash?: string;
  last_payment_amount?: string | number;
  billRefNumber?: string;
  applicationId?: string;
}

export interface PesaflowStatusResponse {
  query_status?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ProcessPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  applicationId?: string;
  amount?: number;
  billRefNumber?: string;
  error?: string;
}
