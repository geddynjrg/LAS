import {
  PdfBlobResponseSchema,
  PdfMetadataResponseSchema,
} from '@/lib/api/schema/application/application.schema';
import { api, validate } from '@/lib/api/utils';
import { updateSession } from '@/lib/session';
import { getLocale } from 'next-intl/server';
import { headers } from 'next/headers';

async function getDrupalRequestHeaders(accept = 'application/json') {
  const [headersList, session, locale] = await Promise.all([
    headers(),
    updateSession(),
    getLocale(),
  ]);

  const requestHeaders: Record<string, string> = {
    Accept: accept,
    'X-Path': headersList.get('x-path') || '',
    'X-Language': locale || '',
  };

  if (process.env.EXTERNAL_API_KEY) {
    requestHeaders['X-API-Key'] = process.env.EXTERNAL_API_KEY;
  }

  if (session?.trim()) {
    requestHeaders.Authorization = `Bearer ${session.trim()}`;
  }

  return requestHeaders;
}

async function fetchDrupalPdfDownload(applicationId: string): Promise<Blob> {
  const baseUrl = process.env.API_URL;
  if (!baseUrl) {
    throw new Error('API_URL is not configured');
  }

  const url = new URL(
    `/api/v1/application/${encodeURIComponent(applicationId)}/pdf`,
    baseUrl,
  );
  url.searchParams.set('format', 'download');

  const response = await fetch(url.toString(), {
    headers: await getDrupalRequestHeaders('application/pdf'),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    let message = `Failed to download PDF: ${response.statusText}`;

    if (errorBody) {
      try {
        const payload = JSON.parse(errorBody) as {
          message?: string;
          error?: string;
        };
        message = payload.message || payload.error || message;
      } catch {
        // Non-JSON error bodies fall back to the default message.
      }
    }

    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/pdf')) {
    const body = await response.text().catch(() => '');
    let message = 'Failed to download application PDF';

    if (body) {
      try {
        const payload = JSON.parse(body) as {
          message?: string;
          error?: string;
        };
        message = payload.message || payload.error || message;
      } catch {
        // Ignore non-JSON bodies.
      }
    }

    throw new Error(message);
  }

  return new Blob([await response.arrayBuffer()], {
    type: 'application/pdf',
  });
}

export async function getApplicationPdfBlob(applicationId: string) {
  const res = await api.GET('/api/v1/application/{application}/pdf', {
    params: {
      path: { application: applicationId },
      query: { format: 'blob' },
    },
  });

  if (!res.response.ok) {
    throw new Error(`Failed to get PDF blob: ${res.response.statusText}`);
  }

  return validate(res, PdfBlobResponseSchema);
}

export async function downloadApplicationPdf(applicationId: string) {
  return fetchDrupalPdfDownload(applicationId);
}

export async function getApplicationPdfMetadata(applicationId: string) {
  const res = await api.GET('/api/v1/application/{application}/pdf', {
    params: {
      path: { application: applicationId },
    },
  });

  if (!res.response.ok) {
    throw new Error(`Failed to get PDF metadata: ${res.response.statusText}`);
  }

  return validate(res, PdfMetadataResponseSchema);
}

export async function warmApplicationPdfCache(applicationId: string) {
  await getApplicationPdfMetadata(applicationId);
}
