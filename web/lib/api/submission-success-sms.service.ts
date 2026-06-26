'use server';

export interface SubmissionSuccessSmsResult {
  success: boolean;
  error?: string;
  smsSent?: number;
  smsFailed?: number;
  message?: string;
}

/**
 * Notify all group members by SMS after a successful application submission.
 * Uses server-to-server Drupal API key auth (no user session required).
 */
export async function sendSubmissionSuccessNotificationSMS(
  applicationId: string,
): Promise<SubmissionSuccessSmsResult> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  const apiKey = process.env.EXTERNAL_API_KEY;

  if (!apiUrl || !apiKey) {
    return {
      success: false,
      error:
        'Submission SMS service is not configured (missing API_URL or EXTERNAL_API_KEY).',
    };
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, '')}/api/v1/application/${encodeURIComponent(applicationId)}/submission-success-sms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({}),
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
          `Submission success SMS failed with status ${response.status}`,
      };
    }

    return {
      success: Boolean(data.success),
      message: data.message,
      smsSent: data.data?.sms_sent ?? 0,
      smsFailed: data.data?.sms_failed ?? 0,
    };
  } catch (error) {
    console.error('[Submission SMS] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
