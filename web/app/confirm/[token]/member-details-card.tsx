'use client';

import type { MemberConfirmationSuccessResponse } from '@/lib/api/schema/member-confirmation.schema';
import { Badge } from '@workspace/ui/components/badge';
import { useTranslations } from 'next-intl';

interface MemberDetailsCardProps {
  memberData: MemberConfirmationSuccessResponse;
}

export function MemberDetailsCard({ memberData }: MemberDetailsCardProps) {
  const t = useTranslations('ConfirmationPage');
  const tCommon = useTranslations('Common');

  const { member, application } = memberData.data;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'; // Green-ish appearance for confirmed
      case 'declined':
        return 'destructive'; // Red appearance for declined
      default:
        return 'secondary'; // Gray appearance for pending/other
    }
  };

  const getStatusLabel = (status: string) => {
    // Try to get translation, fallback to the original status if not found
    try {
      if (status === 'confirmed') return tCommon('status.confirmed');
      if (status === 'declined') return tCommon('status.declined');
      if (status === 'pending') return tCommon('status.pending');
    } catch {
      // If translation fails, fall through to default
    }
    // For unknown statuses, show them as-is but capitalized
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Member Information */}
      <div className="p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-700">
          {t('memberInformation')}
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="text-sm text-neutral-600">{t('memberName')}:</span>
            <span className="text-sm font-medium text-neutral-900">
              {member.name}
            </span>
          </div>

          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="text-sm text-neutral-600">
              {t('phoneNumber')}:
            </span>
            <span className="text-sm font-medium text-neutral-900">
              {member.phone_number}
            </span>
          </div>

          <div className="flex justify-between border-b border-neutral-100 pb-2">
            <span className="text-sm text-neutral-600">
              {t('currentStatus')}:
            </span>
            <Badge
              variant={getStatusBadgeVariant(member.confirmation_status)}
              className="text-xs"
            >
              {getStatusLabel(member.confirmation_status)}
            </Badge>
          </div>

          {member.confirmation_confirmed_at && (
            <div className="flex justify-between">
              <span className="text-sm text-neutral-600">
                {t('confirmedAt')}:
              </span>
              <span className="text-sm font-medium text-neutral-900">
                {formatDate(member.confirmation_confirmed_at)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Application Information */}
      {application &&
        (application.application_id || application.group_name) && (
          <div className="p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-700">
              {t('applicationInformation')}
            </h3>

            <div className="space-y-2">
              {application.application_id && (
                <div className="flex justify-between border-b border-neutral-100 pb-2">
                  <span className="text-sm text-neutral-600">
                    {t('applicationId')}:
                  </span>
                  <span className="font-mono text-xs font-medium text-neutral-900">
                    {application.application_id}
                  </span>
                </div>
              )}

              {application.group_name && (
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">
                    {t('groupName')}:
                  </span>
                  <span className="text-sm font-medium text-neutral-900">
                    {application.group_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
