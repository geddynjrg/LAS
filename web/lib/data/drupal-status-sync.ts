import { ApplicationStatus } from '@/generated/prisma';
import type { ApplicationDetail } from '@/lib/api/schema/application/applications-list.schema';
import { fromApiStatus } from '@/lib/constants/application-status';
import { isSubmittedOrHigher } from '@/lib/constants/sync-status-utils';
import { prisma } from '@/lib/db/prisma';

/** Higher rank = further along the workflow. */
const STATUS_PROGRESS_RANK: Record<ApplicationStatus, number> = {
  [ApplicationStatus.UNSUBMITTED]: 0,
  [ApplicationStatus.DRAFT]: 1,
  [ApplicationStatus.GROUP_MEMBER_CONFIRMATION]: 2,
  [ApplicationStatus.SUBMITTED]: 3,
  [ApplicationStatus.CONSTITUENCY_REVIEW]: 4,
  [ApplicationStatus.APPROVED_BY_CONSTITUENCY]: 5,
  [ApplicationStatus.IN_REVIEW]: 6,
  [ApplicationStatus.PENDING_SECRETARIAT_REVIEW]: 6,
  [ApplicationStatus.PENDING_FUND_TRANSFER]: 6,
  [ApplicationStatus.APPROVED]: 7,
  [ApplicationStatus.PENDING_FINAL_DISBURSEMENT]: 7,
  [ApplicationStatus.REJECTED]: 7,
  [ApplicationStatus.TRAINING]: 8,
  [ApplicationStatus.DISBURSED]: 9,
  [ApplicationStatus.DISBURSEMENT_FAILED]: 9,
  [ApplicationStatus.CLOSED]: 10,
};

export function shouldApplyApiStatusUpdate(
  localStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
): boolean {
  // Constituency returned the application for correction — unlock as DRAFT.
  if (
    newStatus === ApplicationStatus.DRAFT &&
    (localStatus === ApplicationStatus.SUBMITTED ||
      localStatus === ApplicationStatus.CONSTITUENCY_REVIEW ||
      localStatus === ApplicationStatus.GROUP_MEMBER_CONFIRMATION ||
      localStatus === ApplicationStatus.IN_REVIEW)
  ) {
    return true;
  }

  if (
    STATUS_PROGRESS_RANK[newStatus] < STATUS_PROGRESS_RANK[localStatus] &&
    newStatus === ApplicationStatus.UNSUBMITTED
  ) {
    return false;
  }
  return STATUS_PROGRESS_RANK[newStatus] >= STATUS_PROGRESS_RANK[localStatus];
}

export function mapDrupalApiStatusToLocal(apiStatus?: string): ApplicationStatus {
  if (!apiStatus) {
    return ApplicationStatus.DRAFT;
  }

  const mapped = fromApiStatus(apiStatus);

  // Group early review stages under IN_REVIEW for applicant-facing step copy.
  if (
    mapped === ApplicationStatus.CONSTITUENCY_REVIEW ||
    mapped === ApplicationStatus.APPROVED_BY_CONSTITUENCY ||
    mapped === ApplicationStatus.IN_REVIEW ||
    mapped === ApplicationStatus.PENDING_SECRETARIAT_REVIEW ||
    mapped === ApplicationStatus.PENDING_FUND_TRANSFER
  ) {
    return ApplicationStatus.IN_REVIEW;
  }

  return mapped;
}

function parseTimestamp(timestamp?: string | number): number {
  if (typeof timestamp === 'number') {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    const parsed = parseInt(timestamp, 10);
    return isNaN(parsed) ? Date.now() / 1000 : parsed;
  }
  return Date.now() / 1000;
}

export async function applyDrupalStatusToLocalApplication(
  apiApp: Pick<ApplicationDetail, 'application_id' | 'status' | 'changed' | 'id'>,
): Promise<boolean> {
  if (!apiApp.application_id || !apiApp.status) {
    return false;
  }

  const localApp = await prisma.application.findUnique({
    where: { applicationId: apiApp.application_id },
  });

  if (!localApp) {
    return false;
  }

  const newStatus = mapDrupalApiStatusToLocal(apiApp.status);
  const apiUpdatedAt = apiApp.changed
    ? new Date(parseTimestamp(apiApp.changed) * 1000)
    : null;

  const statusShouldUpdate =
    localApp.status !== newStatus &&
    shouldApplyApiStatusUpdate(localApp.status, newStatus);
  const timestampShouldUpdate =
    apiUpdatedAt !== null && localApp.updatedAt < apiUpdatedAt;

  if (!statusShouldUpdate && !timestampShouldUpdate) {
    return false;
  }

  const returningToDraft =
    statusShouldUpdate &&
    newStatus === ApplicationStatus.DRAFT &&
    localApp.status !== ApplicationStatus.DRAFT;

  await prisma.application.update({
    where: { id: localApp.id },
    data: {
      ...(statusShouldUpdate && { status: newStatus }),
      // Let the group reopen the form (group-data / documents) after a return.
      ...(returningToDraft && { applicationProgress: 1 }),
      ...(timestampShouldUpdate && {
        updatedAt: apiUpdatedAt || new Date(),
      }),
      ...(apiApp.id && { externalId: String(apiApp.id) }),
    },
  });

  return statusShouldUpdate;
}

async function fetchDrupalApplicationStatus(
  applicationId: string,
): Promise<ApplicationDetail | null> {
  const apiUrl = process.env.API_URL;
  const apiKey = process.env.EXTERNAL_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('API_URL or EXTERNAL_API_KEY is not configured');
  }

  const response = await fetch(
    `${apiUrl.replace(/\/$/, '')}/api/v1/application/${encodeURIComponent(applicationId)}`,
    {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20000),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  return payload?.data ?? null;
}

/**
 * Pull status updates from Drupal for all submitted+ portal applications.
 * Used by the background cron worker so dashboard status stays current.
 */
export async function syncApplicationStatusFromDrupal(): Promise<{
  checked: number;
  updated: number;
  errors: string[];
}> {
  const applications = await prisma.application.findMany({
    where: {
      status: {
        notIn: [ApplicationStatus.UNSUBMITTED, ApplicationStatus.DRAFT],
      },
    },
    select: {
      applicationId: true,
      status: true,
    },
  });

  const candidates = applications.filter((app) =>
    isSubmittedOrHigher(app.status),
  );

  let updated = 0;
  const errors: string[] = [];

  for (const app of candidates) {
    try {
      const drupalApp = await fetchDrupalApplicationStatus(app.applicationId);
      if (!drupalApp) {
        continue;
      }

      const didUpdate = await applyDrupalStatusToLocalApplication(drupalApp);
      if (didUpdate) {
        updated++;
        console.log(
          `[StatusSync] Updated ${app.applicationId}: Drupal status ${drupalApp.status}`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${app.applicationId}: ${message}`);
      console.warn(
        `[StatusSync] Failed for ${app.applicationId}:`,
        message,
      );
    }
  }

  return {
    checked: candidates.length,
    updated,
    errors,
  };
}
