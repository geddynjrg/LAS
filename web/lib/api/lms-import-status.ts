'use server';

export type LmsImportStatus =
  | 'completed'
  | 'failed'
  | 'processing'
  | 'queued'
  | 'not_found';

export interface LmsImportStatusResult {
  status: LmsImportStatus;
  tempApplicationId?: number;
  error?: string;
}

interface LmsImportStatusResponse {
  success?: boolean;
  data?: {
    status?: LmsImportStatus;
    application_id?: string;
    temp_application_id?: number;
    error?: string;
  };
}

function getLmsConfig(): {
  baseUrl: string;
  apiKey: string;
  host?: string;
} | null {
  const baseUrl = process.env.LMS_API_URL?.replace(/\/$/, '');
  const apiKey = process.env.LMS_API_KEY;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return {
    baseUrl,
    apiKey,
    host: process.env.LMS_API_HOST,
  };
}

function buildLmsHeaders(config: {
  apiKey: string;
  host?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-API-Key': config.apiKey,
  };

  if (config.host) {
    headers.Host = config.host;
  }

  return headers;
}

export async function getLmsImportStatus(
  applicationId: string,
): Promise<LmsImportStatusResult> {
  const config = getLmsConfig();
  if (!config) {
    return { status: 'not_found', error: 'LMS is not configured' };
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/api/v1/application/${encodeURIComponent(applicationId)}/import-status`,
      {
        method: 'GET',
        headers: buildLmsHeaders(config),
        cache: 'no-store',
      },
    );

    const payload = (await response.json()) as LmsImportStatusResponse;
    const status = payload.data?.status ?? 'not_found';

    return {
      status,
      tempApplicationId: payload.data?.temp_application_id,
      error: payload.data?.error,
    };
  } catch (error) {
    console.error('[LMS import status] Request failed:', error);
    return {
      status: 'not_found',
      error: error instanceof Error ? error.message : 'Status check failed',
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForLmsImport(
  applicationId: string,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<{ success: boolean; error?: string; tempApplicationId?: number }> {
  const maxAttempts = options?.maxAttempts ?? 60;
  const intervalMs = options?.intervalMs ?? 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getLmsImportStatus(applicationId);

    if (result.status === 'completed') {
      return {
        success: true,
        tempApplicationId: result.tempApplicationId,
      };
    }

    if (result.status === 'failed') {
      return {
        success: false,
        error: result.error ?? 'LMS import failed',
      };
    }

    if (result.status === 'not_found') {
      return {
        success: false,
        error: 'Application not found in LMS after submission',
      };
    }

    if (attempt < maxAttempts - 1) {
      await sleep(intervalMs);
    }
  }

  return {
    success: false,
    error: 'Timed out waiting for LMS to import the application',
  };
}
