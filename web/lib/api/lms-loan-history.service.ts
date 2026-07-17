'use server';

import type {
  LmsDebtCheckResult,
  LmsGroupLoanStatus,
} from '@/lib/api/lms-loan-history.types';

interface LmsApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
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
    'Content-Type': 'application/json',
    'X-API-Key': config.apiKey,
  };

  if (config.host) {
    headers.Host = config.host;
  }

  return headers;
}

async function fetchLmsJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const config = getLmsConfig();
  if (!config) {
    console.error(
      '[LMS debt check] LMS_API_URL or LMS_API_KEY is not configured',
    );
    return null;
  }

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        ...buildLmsHeaders(config),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[LMS debt check] HTTP ${response.status} for ${path}`);
      return null;
    }

    const payload = (await response.json()) as LmsApiResponse<T>;
    return payload.data ?? null;
  } catch (error) {
    console.error(`[LMS debt check] Request failed for ${path}:`, error);
    return null;
  }
}

const emptyDebtResult = (): LmsDebtCheckResult => ({
  has_debt: false,
  can_proceed: true,
  check_type: null,
  matched_value: null,
  group_loan_id: null,
  group_id: null,
  group_name: null,
  group_registration_number: null,
  constituency_name: null,
  loan_type: null,
  amount_issued: 0,
  amount_repaid: 0,
  outstanding_balance: 0,
  repayment_percentage: 100,
  minimum_payment_required: 0,
  repayment_threshold_percent: 80,
  members: [],
  group_found: false,
  has_prior_financed_loan: false,
  loan_cleared: false,
  eligible_for_endeleza: false,
  eligible_for_wezesha: true,
  endeleza_min_amount: 75000,
  endeleza_max_amount: 500000,
  wezesha_min_amount: 50000,
  wezesha_max_amount: 100000,
});

export async function checkGroupLoanHistory(
  registrationNumber: string,
  options?: {
    groupName?: string;
    constituencyName?: string;
  },
): Promise<LmsDebtCheckResult> {
  const normalized = registrationNumber.trim();
  if (!normalized) {
    return emptyDebtResult();
  }

  const params = new URLSearchParams();
  if (options?.groupName?.trim()) {
    params.set('group_name', options.groupName.trim());
  }
  if (options?.constituencyName?.trim()) {
    params.set('constituency_name', options.constituencyName.trim());
  }

  const query = params.toString();
  const path = `/api/v1/loans/group/${encodeURIComponent(normalized)}${query ? `?${query}` : ''}`;

  const data = await fetchLmsJson<LmsDebtCheckResult>(path);

  return data ?? emptyDebtResult();
}

export async function checkMemberLoanHistory(
  nationalId: string,
): Promise<LmsDebtCheckResult> {
  const normalized = nationalId.trim();
  if (!normalized) {
    return emptyDebtResult();
  }

  const data = await fetchLmsJson<LmsDebtCheckResult>(
    `/api/v1/loans/member/${encodeURIComponent(normalized)}`,
  );

  return data ?? emptyDebtResult();
}

export async function getLmsGroupLoanStatus(
  groupLoanId: number,
): Promise<LmsGroupLoanStatus | null> {
  if (!groupLoanId) {
    return null;
  }

  return fetchLmsJson<LmsGroupLoanStatus>(
    `/api/v1/loans/group-loan/${groupLoanId}`,
  );
}

export async function sendLmsDebtReminderSms(input: {
  groupLoanId: number;
  outstandingBalance: number;
  invoiceLink?: string;
  applicationId?: string;
}): Promise<{
  success: boolean;
  smsSent?: number;
  smsFailed?: number;
  error?: string;
}> {
  const config = getLmsConfig();
  if (!config) {
    return { success: false, error: 'LMS SMS service is not configured' };
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/api/v1/loans/debt-reminder-sms`,
      {
        method: 'POST',
        headers: buildLmsHeaders(config),
        body: JSON.stringify({
          group_loan_id: input.groupLoanId,
          outstanding_balance: input.outstandingBalance,
          invoice_link: input.invoiceLink ?? '',
          application_id: input.applicationId ?? '',
        }),
        cache: 'no-store',
      },
    );

    const payload = (await response.json()) as LmsApiResponse<{
      sms_sent?: number;
      sms_failed?: number;
    }>;

    if (!response.ok) {
      return {
        success: false,
        error:
          payload.message ??
          `SMS request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      smsSent: payload.data?.sms_sent ?? 0,
      smsFailed: payload.data?.sms_failed ?? 0,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to send debt reminder SMS',
    };
  }
}

export async function syncLmsPortalRepayment(input: {
  groupLoanId: number;
  amount: number;
  referenceNumber: string;
  billRefNumber: string;
}): Promise<LmsDebtCheckResult | null> {
  const config = getLmsConfig();
  if (!config) {
    console.error('[LMS repayment sync] LMS is not configured');
    return null;
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/v1/loans/repayments`, {
      method: 'POST',
      headers: buildLmsHeaders(config),
      body: JSON.stringify({
        group_loan_id: input.groupLoanId,
        amount: input.amount,
        reference_number: input.referenceNumber,
        bill_ref_number: input.billRefNumber,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[LMS repayment sync] HTTP ${response.status}`);
      return null;
    }

    const payload =
      (await response.json()) as LmsApiResponse<LmsDebtCheckResult>;
    return payload.data ?? null;
  } catch (error) {
    console.error('[LMS repayment sync] Failed:', error);
    return null;
  }
}

export async function checkMembersForOutstandingDebt(
  nationalIds: string[],
): Promise<LmsDebtCheckResult | null> {
  void nationalIds;
  return null;
}
