import {
  PdfBlobResponseSchema,
  PdfMetadataResponseSchema,
} from '@/lib/api/schema/application/application.schema';
import { api, validate } from '@/lib/api/utils';

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
  const res = await api.GET('/api/v1/application/{application}/pdf', {
    params: {
      path: { application: applicationId },
      query: { format: 'download' },
    },
  });

  if (!res.response.ok) {
    throw new Error(`Failed to download PDF: ${res.response.statusText}`);
  }

  // For PDF download, return the blob directly
  const blob = new Blob([await res.response.arrayBuffer()], {
    type: 'application/pdf',
  });

  return blob;
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
