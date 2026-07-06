'use server';

import { SyncStatus } from '@/generated/prisma';
import { sendToLms } from '@/lib/api/application/create';
import {
  getLmsImportStatus,
  waitForLmsImport,
} from '@/lib/api/lms-import-status';
import {
  LMS_MAX_TOTAL_ATTEMPTS,
  LMS_PERMANENT_ATTEMPTS,
  computeLmsNextRetryAt,
  describeLmsRetryTier,
  isNonRetryableLmsError,
  isReadyForLmsRetry,
} from '@/lib/api/lms-retry-policy';
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

async function recordLmsSyncFailure(
  applicationId: string,
  error: string,
  options?: { permanent?: boolean; attempts?: number },
): Promise<void> {
  const current = await prisma.application.findUnique({
    where: { applicationId },
    select: { lmsSyncAttempts: true },
  });
  const attempts = options?.attempts ?? (current?.lmsSyncAttempts ?? 0) + 1;
  const permanent =
    options?.permanent ||
    isNonRetryableLmsError(error) ||
    attempts >= LMS_MAX_TOTAL_ATTEMPTS;
  const nextRetryAt = permanent ? null : computeLmsNextRetryAt(attempts);
  const tier = describeLmsRetryTier(attempts);

  if (permanent) {
    console.error(
      `[LMS SYNC] Permanent failure for ${applicationId} after ${attempts} attempt(s): ${error}`,
    );
  } else {
    console.warn(
      `[LMS SYNC] Scheduled ${tier} retry for ${applicationId} (attempt ${attempts}/${LMS_MAX_TOTAL_ATTEMPTS}) at ${nextRetryAt?.toISOString() ?? 'never'}: ${error}`,
    );
  }

  await prisma.application.update({
    where: { applicationId },
    data: {
      lmsSyncStatus: permanent ? 'FAILED' : 'PENDING',
      lmsSyncError: error,
      lmsSyncAttempts: permanent ? LMS_PERMANENT_ATTEMPTS : attempts,
      lmsLastSyncAt: new Date(),
      lmsNextRetryAt: nextRetryAt,
    },
  });
}

async function waitForQueuedLmsImport(
  applicationId: string,
): Promise<{ success: boolean; error?: string; referenceId?: string }> {
  const importResult = await waitForLmsImport(applicationId, {
    maxAttempts: 40,
    intervalMs: 5000,
  });

  if (!importResult.success) {
    await recordLmsSyncFailure(
      applicationId,
      importResult.error ?? 'LMS import still in progress',
    );

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
      lmsNextRetryAt: null,
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
        lmsNextRetryAt: null,
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
    await recordLmsSyncFailure(applicationId, message);
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
    await recordLmsSyncFailure(
      applicationId,
      verified.error ?? 'Could not verify LMS import',
    );

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
      lmsNextRetryAt: null,
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
        lmsNextRetryAt: null,
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
  skipped: number;
  waiting: number;
}> {
  const now = new Date();

  const candidates = await prisma.application.findMany({
    where: {
      syncStatus: SyncStatus.COMPLETED,
      lmsSyncAttempts: { lt: LMS_MAX_TOTAL_ATTEMPTS },
      OR: [
        { lmsSyncStatus: null },
        { lmsSyncStatus: 'PENDING' },
        { lmsSyncStatus: 'FAILED' },
      ],
    },
    orderBy: [{ lmsNextRetryAt: 'asc' }, { updatedAt: 'asc' }],
    take: batchSize * 4,
    select: {
      applicationId: true,
      lmsSyncStatus: true,
      lmsSyncError: true,
      lmsSyncAttempts: true,
      lmsNextRetryAt: true,
      lmsLastSyncAt: true,
    },
  });

  const ready = candidates.filter((candidate) => {
    if (isNonRetryableLmsError(candidate.lmsSyncError)) {
      return false;
    }
    return isReadyForLmsRetry(
      candidate.lmsNextRetryAt,
      candidate.lmsLastSyncAt,
      now,
    );
  });

  const waiting = candidates.length - ready.length;
  const batch = ready.slice(0, batchSize);

  if (batch.length > 0) {
    console.log(
      `[LMS SYNC RETRY] Processing ${batch.length} application(s); ${waiting} waiting for next retry window`,
    );
  }

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const candidate of batch) {
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
        const error =
          recovery.error ??
          'Loan and business details are required before LMS import';
        await recordLmsSyncFailure(application.applicationId, error);
        skipped += 1;
        console.warn(
          `[LMS SYNC RETRY] Skipped ${candidate.applicationId} (missing loan data): ${error}`,
        );
        continue;
      }
    }

    if (!application) {
      failed += 1;
      continue;
    }

    console.log(
      `[LMS SYNC RETRY] Attempting ${application.applicationId} (status=${application.lmsSyncStatus}, attempts=${application.lmsSyncAttempts}, tier=${describeLmsRetryTier(application.lmsSyncAttempts)})`,
    );

    const { transformApplicationForExternalApi } =
      await import('@/lib/api/sync.service');
    const payload = await transformApplicationForExternalApi(application);
    const result = await syncApplicationToLms(
      application.applicationId,
      payload,
    );

    if (result.success) {
      succeeded += 1;
      console.log(
        `[LMS SYNC RETRY] Succeeded for ${application.applicationId}`,
      );
    } else if (isRetryableLmsError(result.error)) {
      console.warn(
        `[LMS SYNC RETRY] Rate limited while syncing ${application.applicationId}; stopping batch`,
      );
      break;
    } else {
      failed += 1;
      console.error(
        `[LMS SYNC RETRY] Failed for ${application.applicationId}:`,
        result.error,
      );
    }

    await sleep(300);
  }

  return {
    processed: batch.length,
    succeeded,
    failed,
    skipped,
    waiting,
  };
}
