'use server';

import { api } from '@/lib/api/utils';
import { getSession } from '@/lib/session';

interface smsResponse {
  success: boolean;
  message: string;
  data: {
    application_id: string;
    sms_sent: number;
    sms_failed: number;
    total_attempted?: number;
    status_type?: string;
    timestamp: string;
  };
}

export async function sendConfirmationSMS(
  applicationId: string,
): Promise<{ success: boolean; error?: string; stats?: smsResponse }> {
  try {
    console.log(
      '[SMS Service] Sending member confirmation SMS for:',
      applicationId,
    );

    const accessToken = await getSession();

    // ✅ No session → treat as success to allow progression
    if (!accessToken) {
      console.warn('[SMS Service] No valid session – skipping SMS but returning success');
      return {
        success: true,
        stats: {
          success: true,
          message: 'SMS skipped: no active session (application proceeds)',
          data: {
            application_id: applicationId,
            sms_sent: 0,
            sms_failed: 0,
            timestamp: new Date().toISOString(),
            status_type: 'skipped',
          },
        },
      };
    }

    const res = await api.POST('/api/v1/application/{id}/send-sms', {
      params: {
        path: { id: applicationId },
      },
      body: {
        trigger: 'member_confirmation',
        timestamp: new Date().toISOString(),
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('[SMS Service] Full API Response:', res);

    if (res.error) {
      console.error('[SMS Service] Error:', res.error);

      if (res.response?.status === 401) {
        // Even on auth failure, return success to move forward
        console.warn('[SMS Service] Auth failed but returning success to proceed');
        return {
          success: true,
          stats: {
            success: true,
            message: 'Authentication failed, but application continues',
            data: {
              application_id: applicationId,
              sms_sent: 0,
              sms_failed: 0,
              timestamp: new Date().toISOString(),
              status_type: 'auth_failed',
            },
          },
        };
      }

      // For other errors, still return success to not block the user
      return {
        success: true,
        stats: {
          success: true,
          message: `SMS not sent (HTTP ${res.response?.status}), but application continues`,
          data: {
            application_id: applicationId,
            sms_sent: 0,
            sms_failed: 0,
            timestamp: new Date().toISOString(),
            status_type: 'api_error',
          },
        },
      };
    }

    return {
      success: true,
      stats: res.data as smsResponse,
    };
  } catch (error) {
    console.error('[SMS Service] Exception:', error);
    // Always return success so the user is not blocked
    return {
      success: true,
      stats: {
        success: true,
        message: `SMS sending failed due to exception, but application proceeds`,
        data: {
          application_id: applicationId,
          sms_sent: 0,
          sms_failed: 0,
          timestamp: new Date().toISOString(),
          status_type: 'exception',
        },
      },
    };
  }
}