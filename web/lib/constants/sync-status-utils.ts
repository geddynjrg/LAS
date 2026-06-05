import { ApplicationStatus, SyncStatus } from '@/generated/prisma';

const SUBMITTED_OR_HIGHER: ApplicationStatus[] = [
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.GROUP_MEMBER_CONFIRMATION,
  ApplicationStatus.CONSTITUENCY_REVIEW,
  ApplicationStatus.APPROVED_BY_CONSTITUENCY,
  ApplicationStatus.IN_REVIEW,
  ApplicationStatus.PENDING_SECRETARIAT_REVIEW,
  ApplicationStatus.PENDING_FUND_TRANSFER,
  ApplicationStatus.PENDING_FINAL_DISBURSEMENT,
  ApplicationStatus.APPROVED,
  ApplicationStatus.TRAINING,
  ApplicationStatus.DISBURSEMENT_FAILED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.DISBURSED,
  ApplicationStatus.CLOSED,
];

export function isSubmittedOrHigher(status: ApplicationStatus): boolean {
  return SUBMITTED_OR_HIGHER.includes(status);
}

export function shouldQueueForSync(status: ApplicationStatus): boolean {
  return isSubmittedOrHigher(status);
}

/**
 * Applications synced to Drupal/LMS while still marked draft locally should
 * display (and be repaired to) SUBMITTED.
 */
export function normalizeSyncedApplicationStatus(
  status: ApplicationStatus,
  options: {
    syncStatus?: SyncStatus | null;
    externalId?: string | null;
    lmsSyncStatus?: string | null;
  },
): ApplicationStatus {
  const isSynced =
    options.syncStatus === SyncStatus.COMPLETED ||
    Boolean(options.externalId) ||
    options.lmsSyncStatus === 'COMPLETED';

  if (
    isSynced &&
    (status === ApplicationStatus.DRAFT ||
      status === ApplicationStatus.UNSUBMITTED)
  ) {
    return ApplicationStatus.SUBMITTED;
  }

  return status;
}
