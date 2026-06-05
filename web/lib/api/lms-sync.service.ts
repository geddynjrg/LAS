'use server';

import { sendToLms } from '@/lib/api/application/create';
import { mapStatusForLms } from '@/lib/api/lms-status-map';
import type { ApplicationPostRequest } from '@/lib/api/schema/application/application.schema';
import { prisma } from '@/lib/db/prisma';
import { SyncStatus } from '@/generated/prisma';

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
    await prisma.application.update({
      where: { applicationId },
      data: {
        lmsSyncStatus: 'FAILED',
        lmsSyncError: message,
        lmsSyncAttempts: { increment: 1 },
        lmsLastSyncAt: new Date(),
      },
    });
    return { success: false, error: message };
  }

  const referenceId =
    'data' in result && result.data && 'application_id' in result.data
      ? String(result.data.application_id)
      : applicationId;

  await prisma.application.update({
    where: { applicationId },
    data: {
      lmsSyncStatus: 'COMPLETED',
      lmsSyncError: null,
      lmsReferenceId: referenceId,
      lmsLastSyncAt: new Date(),
    },
  });

  return { success: true, referenceId };
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

export async function processLmsSyncBackfill(batchSize = 10): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const candidates = await prisma.application.findMany({
    where: {
      syncStatus: SyncStatus.COMPLETED,
      OR: [
        { lmsSyncStatus: null },
        { lmsSyncStatus: 'PENDING' },
        {
          lmsSyncStatus: 'FAILED',
          lmsSyncAttempts: { lt: 5 },
        },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: batchSize,
    select: { applicationId: true },
  });

  let succeeded = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const application = await prisma.application.findUnique({
      where: { applicationId: candidate.applicationId },
      include: applicationInclude,
    });

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
    } else {
      failed += 1;
      console.error(
        `[LMS SYNC] Failed for ${application.applicationId}:`,
        result.error,
      );
    }
  }

  return {
    processed: candidates.length,
    succeeded,
    failed,
  };
}
