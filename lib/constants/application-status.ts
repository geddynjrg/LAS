import { ApplicationStatus } from '@/generated/prisma';

/**
 * Configuration for application statuses.
 * This is the single source of truth for all status-related mappings and display settings.
 */
interface StatusConfig {
  /** Local Prisma enum value */
  local: ApplicationStatus;
  /** API string value (Drupal backend) */
  api: string;
  /** Display label */
  label: string;
  /** Badge variant for admin/user displays */
  badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

/**
 * Complete status configuration mapping.
 * Add new statuses here only - they will automatically propagate to all usages.
 */
export const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  [ApplicationStatus.UNSUBMITTED]: {
    local: ApplicationStatus.UNSUBMITTED,
    api: 'draft',
    label: 'Not Started',
    badgeVariant: 'default',
  },
  [ApplicationStatus.DRAFT]: {
    local: ApplicationStatus.DRAFT,
    api: 'draft',
    label: 'Draft',
    badgeVariant: 'warning',
  },
  [ApplicationStatus.GROUP_MEMBER_CONFIRMATION]: {
    local: ApplicationStatus.GROUP_MEMBER_CONFIRMATION,
    api: 'group_member_confirmation',
    label: 'Member Confirmation',
    badgeVariant: 'info',
  },
  [ApplicationStatus.SUBMITTED]: {
    local: ApplicationStatus.SUBMITTED,
    api: 'submitted',
    label: 'Submitted',
    badgeVariant: 'info',
  },
  [ApplicationStatus.CONSTITUENCY_REVIEW]: {
    local: ApplicationStatus.CONSTITUENCY_REVIEW,
    api: 'constituency_review',
    label: 'Constituency Review',
    badgeVariant: 'info',
  },
  [ApplicationStatus.APPROVED_BY_CONSTITUENCY]: {
    local: ApplicationStatus.APPROVED_BY_CONSTITUENCY,
    api: 'approved_by_constituency',
    label: 'Approved by Constituency',
    badgeVariant: 'info',
  },
  [ApplicationStatus.IN_REVIEW]: {
    local: ApplicationStatus.IN_REVIEW,
    api: 'under_review',
    label: 'In Review',
    badgeVariant: 'info',
  },
  [ApplicationStatus.APPROVED]: {
    local: ApplicationStatus.APPROVED,
    api: 'approved',
    label: 'Approved',
    badgeVariant: 'success',
  },
  [ApplicationStatus.TRAINING]: {
    local: ApplicationStatus.TRAINING,
    api: 'training',
    label: 'Training',
    badgeVariant: 'info',
  },
  [ApplicationStatus.REJECTED]: {
    local: ApplicationStatus.REJECTED,
    api: 'rejected',
    label: 'Rejected',
    badgeVariant: 'danger',
  },
  [ApplicationStatus.DISBURSED]: {
    local: ApplicationStatus.DISBURSED,
    api: 'disbursed',
    label: 'Disbursed',
    badgeVariant: 'success',
  },
  [ApplicationStatus.CLOSED]: {
    local: ApplicationStatus.CLOSED,
    api: 'closed',
    label: 'Closed',
    badgeVariant: 'default',
  },
};

/**
 * Convert local Prisma status to API string value.
 * Use this when sending data to the backend.
 */
export function toApiStatus(
  localStatus: ApplicationStatus,
):
  | 'draft'
  | 'group_member_confirmation'
  | 'submitted'
  | 'constituency_review'
  | 'approved_by_constituency'
  | 'under_review'
  | 'approved'
  | 'training'
  | 'rejected'
  | 'disbursed'
  | 'closed' {
  return STATUS_CONFIG[localStatus].api as
    | 'draft'
    | 'group_member_confirmation'
    | 'submitted'
    | 'constituency_review'
    | 'approved_by_constituency'
    | 'under_review'
    | 'approved'
    | 'training'
    | 'rejected'
    | 'disbursed'
    | 'closed';
}

/**
 * Convert API string value to local Prisma status.
 * Use this when receiving data from the backend.
 */
export function fromApiStatus(apiStatus: string): ApplicationStatus {
  const entry = Object.values(STATUS_CONFIG).find((c) => c.api === apiStatus);
  return entry?.local || ApplicationStatus.DRAFT;
}

/**
 * Get display label for a status.
 */
export function getStatusLabel(status: ApplicationStatus): string {
  return STATUS_CONFIG[status].label;
}

/**
 * Get badge configuration for a status.
 * Use this for StatusBadge components.
 */
export function getStatusBadgeConfig(status: ApplicationStatus) {
  const config = STATUS_CONFIG[status];
  return {
    variant: config.badgeVariant,
    label: config.label,
  };
}
