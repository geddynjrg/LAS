'use server';

import { SyncStatus } from '@/generated/prisma';
import { sendToLms } from '@/lib/api/application/create';
import {
  getLmsImportStatus,
  waitForLmsImport,
} from '@/lib/api/lms-import-status';
import { mapStatusForLms } from '@/lib/api/lms-status-map';
import type { ApplicationPostRequest } from '@/lib/api/schema/application/application.schema';
import { recoverApplicationDataFromDrupal } from '@/lib/data/drupal-application-recovery';
import { prisma } from '@/lib/db/prisma';

function isRateLimitError(message?: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('too many requests') || lower.includes('rate_limited');
}

function isRetryableLmsError(message?: string): boolean {
  if (!message) return false;
  if (isRateLimitError(message)) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes('payload too large') ||
    lower.includes('request body too large') ||
    lower.includes('exceeds lms limit')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForQueuedLmsImport(
  applicationId: string,
): Promise<{ success: boolean; error?: string; referenceId?: string }> {
  const importResult = await waitForLmsImport(applicationId, {
    maxAttempts: 40,
    intervalMs: 5000,
  });

  if (!importResult.success) {
    await prisma.application.update({
      where: { applicationId },
      data: {
        lmsSyncStatus: 'PENDING',
        lmsSyncError: importResult.error ?? 'LMS import still in progress',
        lmsSyncAttempts: { increment: 1 },
        lmsLastSyncAt: new Date(),
      },
    });

    return {
      success: false,
      error: importResult.error ?? 'LMS import did not complete in time',
    };
  }

  await prisma.application.update({
    where: { applicationId },
    data: {
      lmsSyncStatus: 'COMPLETED',
      lmsSyncError: null,
      lmsReferenceId: applicationId,
      lmsLastSyncAt: new Date(),
    },
  });

  return { success: true, referenceId: applicationId };
}

export async function syncApplicationToLms(
  applicationId: string,
  payload: ApplicationPostRequest,
): Promise<{ success: boolean; error?: string; referenceId?: string }> {
  if (!process.env.LMS_API_URL || !process.env.LMS_API_KEY) {
    return {
      success: false,
      error: 'LMS_API_URL or LMS_API_KEY is not configured',
    };
  }

  const existing = await getLmsImportStatus(applicationId);
  if (existing.status === 'completed') {
    await prisma.application.update({
      where: { applicationId },
      data: {
        lmsSyncStatus: 'COMPLETED',
        lmsSyncError: null,
        lmsReferenceId: applicationId,
        lmsLastSyncAt: new Date(),
      },
    });

    return { success: true, referenceId: applicationId };
  }

  if (existing.status === 'queued' || existing.status === 'processing') {
    await prisma.application.update({
      where: { applicationId },
      data: { lmsSyncStatus: 'PENDING', lmsSyncError: null },
    });

    return waitForQueuedLmsImport(applicationId);
  }

  await prisma.application.update({
    where: { applicationId },
    data: { lmsSyncStatus: 'PENDING' },
  });

  const lmsPayload: ApplicationPostRequest = {
    ...payload,
    application_id: payload.application_id || applicationId,
    status: mapStatusForLms(payload.status),
  };

  const result = await sendToLms(lmsPayload);

  if ('error' in result && result.error) {
    const message = result.message || result.error;
    const retryable = isRetryableLmsError(message);

    await prisma.application.update({
      where: { applicationId },
      data: {
        lmsSyncStatus: retryable ? 'PENDING' : 'FAILED',
        lmsSyncError: message,
        lmsSyncAttempts: { increment: 1 },
        lmsLastSyncAt: new Date(),
      },
    });
    return { success: false, error: message };
  }

  const queued =
    'data' in result &&
    result.data &&
    typeof result.data === 'object' &&
    'status' in result.data &&
    result.data.status === 'queued';

  if (queued) {
    return waitForQueuedLmsImport(applicationId);
  }

  const verified = await waitForLmsImport(applicationId, {
    maxAttempts: 3,
    intervalMs: 2000,
  });

  if (!verified.success) {
    await prisma.application.update({
      where: { applicationId },
      data: {
        lmsSyncStatus: 'PENDING',
        lmsSyncError: verified.error ?? 'Could not verify LMS import',
        lmsSyncAttempts: { increment: 1 },
        lmsLastSyncAt: new Date(),
      },
    });

    return {
      success: false,
      error: verified.error ?? 'Could not verify LMS import',
    };
  }

  await prisma.application.update({
    where: { applicationId },
    data: {
      lmsSyncStatus: 'COMPLETED',
      lmsSyncError: null,
      lmsReferenceId: applicationId,
      lmsLastSyncAt: new Date(),
    },
  });

  return { success: true, referenceId: applicationId };
}

export async function ensureApplicationLmsSync(
  applicationId: string,
): Promise<{ success: boolean; error?: string }> {
  let application = await prisma.application.findUnique({
    where: { applicationId },
    include: applicationInclude,
  });

  if (!application) {
    return { success: false, error: 'Application not found' };
  }

  if (
    application.syncStatus !== SyncStatus.COMPLETED &&
    !application.externalId
  ) {
    return {
      success: false,
      error: 'Application must be synced to Drupal before LMS import',
    };
  }

  let recovery: { recovered: boolean; error?: string } | undefined;
  const hasLoanData =
    application.loanConditions != null && application.proposedBusiness != null;
  if (!hasLoanData) {
    recovery = await recoverApplicationDataFromDrupal(applicationId);
    if (recovery.recovered) {
      application = await prisma.application.findUnique({
        where: { applicationId },
        include: applicationInclude,
      });

      if (!application) {
        return {
          success: false,
          error: 'Application not found after recovery',
        };
      }
    }
  }

  const hasLoanDataAfterRecovery =
    application.loanConditions != null && application.proposedBusiness != null;
  if (!hasLoanDataAfterRecovery) {
    return {
      success: false,
      error:
        recovery?.error ??
        'Loan and business details are required before LMS import',
    };
  }

  const importStatus = await getLmsImportStatus(applicationId);
  if (importStatus.status === 'completed') {
    await prisma.application.update({
      where: { applicationId },
      data: {
        lmsSyncStatus: 'COMPLETED',
        lmsSyncError: null,
        lmsReferenceId: applicationId,
        lmsLastSyncAt: new Date(),
      },
    });
    return { success: true };
  }

  if (application.lmsSyncStatus === 'COMPLETED') {
    return { success: true };
  }

  const { transformApplicationForExternalApi } =
    await import('@/lib/api/sync.service');
  const payload = await transformApplicationForExternalApi(application);
  const result = await syncApplicationToLms(applicationId, payload);

  return {
    success: result.success,
    error: result.error,
  };
}

const applicationInclude = {
  user: true,
  groupData: true,
  members: true,
  loanConditions: true,
  proposedBusiness: {
    include: {
      customExpenses: true,
    },
  },
  confirmations: true,
} as const;

export async function processLmsSyncBackfill(batchSize = 5): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const candidates = await prisma.application.findMany({
    where: {
      syncStatus: SyncStatus.COMPLETED,
      OR: [
        {
          loanConditions: { isNot: null },
          proposedBusiness: { isNot: null },
          OR: [
            { lmsSyncStatus: null },
            { lmsSyncStatus: 'PENDING' },
            {
              lmsSyncStatus: 'FAILED',
              lmsSyncAttempts: { lt: 5 },
            },
          ],
        },
        {
          groupData: null,
          OR: [
            { lmsSyncStatus: 'PENDING' },
            {
              lmsSyncStatus: 'FAILED',
              lmsSyncAttempts: { lt: 6 },
            },
          ],
        },
      ],
    },
    orderBy: { updatedAt: 'asc' },
    take: batchSize,
    select: { applicationId: true, lmsSyncStatus: true },
  });

  let succeeded = 0;
  let failed = 0;

  for (const candidate of candidates) {
    let application = await prisma.application.findUnique({
      where: { applicationId: candidate.applicationId },
      include: applicationInclude,
    });

    if (!application) {
      failed += 1;
      continue;
    }

    if (
      application.loanConditions == null ||
      application.proposedBusiness == null
    ) {
      const recovery = await recoverApplicationDataFromDrupal(
        application.applicationId,
      );
      if (recovery.recovered) {
        application = await prisma.application.findUnique({
          where: { applicationId: candidate.applicationId },
          include: applicationInclude,
        });
      } else if (!application.loanConditions || !application.proposedBusiness) {
        failed += 1;
        console.error(
          `[LMS SYNC] Missing loan data for ${candidate.applicationId}:`,
          recovery.error ?? 'loan/business data not in portal or Drupal',
        );
        continue;
      }
    }

    if (!application) {
      failed += 1;
      continue;
    }

    const { transformApplicationForExternalApi } =
      await import('@/lib/api/sync.service');
    const payload = await transformApplicationForExternalApi(application);
    const result = await syncApplicationToLms(
      application.applicationId,
      payload,
    );

    if (result.success) {
      succeeded += 1;
    } else if (isRetryableLmsError(result.error)) {
      console.warn(
        `[LMS SYNC] Rate limited while syncing ${application.applicationId}; will retry later`,
      );
      break;
    } else {
      failed += 1;
      console.error(
        `[LMS SYNC] Failed for ${application.applicationId}:`,
        result.error,
      );
    }

    await sleep(300);
  }

  return {
    processed: candidates.length,
    succeeded,
    failed,
  };
}
