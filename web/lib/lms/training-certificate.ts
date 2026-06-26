'use server';

export interface TrainingCertificateStatus {
  available: boolean;
  eligibleFrom: string | null;
  /** True when LMS has a trained phase application for this ID */
  hasTrainingRecord: boolean;
  isTrained: boolean;
}

interface TrainingCertificateStatusResponse {
  success?: boolean;
  data?: {
    available?: boolean;
    eligible_from?: string;
    application_id?: string;
    disbursed?: boolean;
    is_trained?: boolean;
  };
}

function getLmsConfig() {
  const lmsApiUrl = process.env.LMS_API_URL;
  const lmsApiKey = process.env.LMS_API_KEY;

  if (!lmsApiUrl || !lmsApiKey) {
    return null;
  }

  return { lmsApiUrl, lmsApiKey };
}

export async function getTrainingCertificateStatus(
  applicationId: string,
): Promise<TrainingCertificateStatus> {
  const empty: TrainingCertificateStatus = {
    available: false,
    eligibleFrom: null,
    hasTrainingRecord: false,
    isTrained: false,
  };

  const config = getLmsConfig();
  if (!config) {
    return empty;
  }

  try {
    const url = new URL(
      `/api/v1/application/${encodeURIComponent(applicationId)}/training-certificate/status`,
      config.lmsApiUrl,
    );

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-API-Key': config.lmsApiKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(
        `Training certificate status check failed for ${applicationId}: HTTP ${response.status}`,
      );
      return empty;
    }

    const payload =
      (await response.json()) as TrainingCertificateStatusResponse;
    const data = payload.data;

    return {
      available: data?.available === true,
      eligibleFrom: data?.eligible_from ?? null,
      isTrained: data?.is_trained === true,
      hasTrainingRecord: Boolean(
        data?.is_trained ||
        data?.eligible_from ||
        data?.available ||
        data?.disbursed,
      ),
    };
  } catch (error) {
    console.error('Failed to check training certificate availability', error);
    return empty;
  }
}

export async function getTrainingCertificateAvailability(
  applicationId: string,
): Promise<boolean> {
  const status = await getTrainingCertificateStatus(applicationId);
  return status.available;
}

export async function fetchTrainingCertificate(
  applicationId: string,
): Promise<Response | null> {
  const config = getLmsConfig();
  if (!config) {
    return null;
  }

  const url = new URL(
    `/api/v1/application/${encodeURIComponent(applicationId)}/training-certificate`,
    config.lmsApiUrl,
  );

  return fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/pdf',
      'X-API-Key': config.lmsApiKey,
    },
    cache: 'no-store',
  });
}
