'use server';

export interface PaymentSuccessSmsResult {
  success: boolean;
  error?: string;
  smsSent?: number;
  smsFailed?: number;
  message?: string;
}

/**
 * Notify all group members by SMS after a successful loan repayment.
 * Uses server-to-server Drupal API key auth (no user session required).
 */
export async function sendPaymentSuccessNotificationSMS(
  applicationId: string,
  amount: number,
  billRefNumber?: string,
): Promise<PaymentSuccessSmsResult> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  const apiKey = process.env.EXTERNAL_API_KEY;

  if (!apiUrl || !apiKey) {
    return {
      success: false,
      error: 'Payment SMS service is not configured (missing API_URL or EXTERNAL_API_KEY).',
    };
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, '')}/api/v1/application/${encodeURIComponent(applicationId)}/payment-success-sms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          amount: amount.toFixed(2),
          bill_ref_number: billRefNumber ?? '',
        }),
        cache: 'no-store',
      },
    );

    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      data?: { sms_sent?: number; sms_failed?: number };
      error?: string;
    };

    if (!response.ok) {
      return {
        success: false,
        error:
          data.message ||
          data.error ||
          `Payment success SMS failed with status ${response.status}`,
      };
    }

    return {
      success: Boolean(data.success),
      message: data.message,
      smsSent: data.data?.sms_sent ?? 0,
      smsFailed: data.data?.sms_failed ?? 0,
    };
  } catch (error) {
    console.error('[Payment SMS] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
