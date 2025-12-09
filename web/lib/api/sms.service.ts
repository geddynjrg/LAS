// lib/api/sms.service.ts - UPDATED FOR JWT_AUTH
'use server';

import { api } from '@/lib/api/utils';
import { getSession } from '@/lib/session'; // Your JWT session utility

export async function sendConfirmationSMS(
  applicationId: string,
): Promise<{ success: boolean; error?: string; stats?: any }> {
  try {
    console.log('[SMS Service] Sending member confirmation SMS for:', applicationId);
    
    // Get the JWT access token from your session
    const accessToken = await getSession();
    
    if (!accessToken) {
      return {
        success: false,
        error: 'Authentication required. Please log in again.',
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
      // Add JWT authorization header for jwt_auth authentication
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('[SMS Service] Full API Response:', res);

    if (res.error) {
      console.error('[SMS Service] Error:', res.error);
      
      if (res.response?.status === 401) {
        return {
          success: false,
          error: 'Authentication failed. Please log in again.',
        };
      }
      
      return {
        success: false,
        error: `HTTP ${res.response?.status}: ${res.error.message || 'Failed to send SMS'}`,
      };
    }

    return {
      success: true,
      stats: res.data,
    };

  } catch (error) {
    console.error('[SMS Service] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}