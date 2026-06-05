const LMS_ACCEPTED_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'disbursed',
  'closed',
] as const;

export type LmsAcceptedStatus = (typeof LMS_ACCEPTED_STATUSES)[number];

const STATUS_MAP: Record<string, LmsAcceptedStatus> = {
  group_member_confirmation: 'draft',
  constituency_review: 'submitted',
  approved_by_constituency: 'under_review',
  under_review: 'under_review',
  pending_secretariat_review: 'under_review',
  pending_fund_transfer: 'under_review',
  training: 'under_review',
  pending_final_disbursement: 'approved',
  disbursement_failed: 'rejected',
  unassigned: 'submitted',
};

export function mapStatusForLms(apiStatus: string): LmsAcceptedStatus {
  if (LMS_ACCEPTED_STATUSES.includes(apiStatus as LmsAcceptedStatus)) {
    return apiStatus as LmsAcceptedStatus;
  }
  return STATUS_MAP[apiStatus] ?? 'submitted';
}
