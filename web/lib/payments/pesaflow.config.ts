export interface PesaflowConfig {
  checkoutUrl: string;
  statusUrl: string;
  apiClientId: string;
  serviceId: string;
  hmacKey: string;
  hmacSecret: string;
  billDesc: string;
  sendStk: boolean;
  publicAppUrl: string;
}

function trim(value: string | undefined): string {
  return value?.trim() ?? '';
}

export function getPesaflowConfig(): PesaflowConfig | null {
  const apiClientId = trim(process.env.PESAFLOW_API_CLIENT_ID);
  const serviceId = trim(process.env.PESAFLOW_SERVICE_ID);
  const hmacKey =
    trim(process.env.PESAFLOW_HMAC_KEY) || trim(process.env.PESAFLOW_API_KEY);
  const hmacSecret = trim(process.env.PESAFLOW_HMAC_SECRET);
  const checkoutUrl =
    trim(process.env.PESAFLOW_CHECKOUT_URL) ||
    trim(process.env.PESAFLOW_API_URL);
  const statusUrl =
    trim(process.env.PESAFLOW_STATUS_URL) ||
    'https://test.pesaflow.com/api/invoice/payment/status';
  const publicAppUrl =
    trim(process.env.NEXT_PUBLIC_APP_URL) ||
    trim(process.env.NEXT_PUBLIC_API_URL) ||
    'https://loans-staging.uwezo.go.ke';

  if (!apiClientId || !serviceId || !hmacKey || !hmacSecret || !checkoutUrl) {
    return null;
  }

  return {
    checkoutUrl,
    statusUrl,
    apiClientId,
    serviceId,
    hmacKey,
    hmacSecret,
    billDesc: trim(process.env.PESAFLOW_BILL_DESC) || 'Uwezo Fund Repayment',
    sendStk: trim(process.env.PESAFLOW_SEND_STK).toLowerCase() === 'true',
    publicAppUrl: publicAppUrl.replace(/\/$/, ''),
  };
}

export function isPesaflowConfiguredFromEnv(): boolean {
  return getPesaflowConfig() !== null;
}

export function getPublicAppBaseUrl(): string {
  return (
    trim(process.env.NEXT_PUBLIC_APP_URL) ||
    trim(process.env.NEXT_PUBLIC_API_URL) ||
    'https://loans-staging.uwezo.go.ke'
  ).replace(/\/$/, '');
}
