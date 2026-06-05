'use server';

export interface WardOption {
  label: string;
  value: string;
}

interface LmsWardRow {
  id: number;
  ward_name?: string;
  name?: string;
}

interface LmsWardsResponse {
  success?: boolean;
  data?: LmsWardRow[];
  meta?: { count?: number };
}

/**
 * Fetch wards for a constituency from the LMS location database.
 */
export async function getWardsForConstituencyName(
  constituencyName: string,
): Promise<WardOption[]> {
  if (!constituencyName?.trim()) {
    return [];
  }

  const lmsApiUrl = process.env.LMS_API_URL;
  const lmsApiKey = process.env.LMS_API_KEY;

  if (!lmsApiUrl || !lmsApiKey) {
    console.error('LMS_API_URL or LMS_API_KEY is not configured');
    return [];
  }

  try {
    const url = new URL('/api/v1/locations/wards', lmsApiUrl);
    url.searchParams.set('constituency_name', constituencyName.trim());

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-API-Key': lmsApiKey,
    };

    if (process.env.LMS_API_HOST) {
      headers.Host = process.env.LMS_API_HOST;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch wards for "${constituencyName}": HTTP ${response.status}`,
      );
      return [];
    }

    const payload = (await response.json()) as LmsWardsResponse;
    const wards = payload.data ?? [];

    return wards
      .map((ward) => {
        const label = (ward.ward_name ?? ward.name ?? '').trim();
        if (!label) {
          return null;
        }
        return { label, value: label };
      })
      .filter((ward): ward is WardOption => ward !== null)
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error(
      `Error fetching wards for constituency "${constituencyName}":`,
      error,
    );
    return [];
  }
}
