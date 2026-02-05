// lib/api/external-apis.ts
'use server';

import { ApplicationPostRequest } from '@/lib/api/schema/application/application.schema';

// lib/api/external-apis.ts

export interface ApiResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

export async function sendToBackendApi(
  data: ApplicationPostRequest,
): Promise<ApiResult> {
  try {
    const response = await fetch(`${process.env.API_URL}/api/v1/application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.EXTERNAL_API_KEY || '',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || `HTTP ${response.status}`,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: result,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

export async function sendToLmsApi(
  data: ApplicationPostRequest,
): Promise<ApiResult> {
  try {
    const response = await fetch(
      `${process.env.LMS_API_URL}/api/v1/application`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.LMS_API_KEY || '',
        },
        body: JSON.stringify(data),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || `HTTP ${response.status}`,
        timestamp: new Date(),
      };
    }

    return {
      success: true,
      data: result,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}
