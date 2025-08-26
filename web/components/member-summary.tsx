import type { MembersData } from '@/lib/data/application';
import { IconUserCheck, IconUsers } from '@tabler/icons-react';
import { Badge } from '@workspace/ui/components/badge';
import { Card } from '@workspace/ui/components/card';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

// Progress component - creating a simple implementation
const Progress: FC<{ value: number; className?: string }> = ({
  value,
  className,
}) => {
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-neutral-200 ${className}`}
    >
      <div
        className="h-full rounded-full bg-green-500 transition-all duration-300 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
};

interface MemberSummaryProps {
  membersData?: MembersData;
  variant?: 'compact' | 'detailed';
  showProgress?: boolean;
  className?: string;
}

interface MemberStats {
  total: number;
  confirmed: number;
  pending: number;
  confirmationProgress: number;
  roleBreakdown: {
    Chairman: number;
    Secretary: number;
    Member: number;
  };
}

export const MemberSummary: FC<MemberSummaryProps> = ({
  membersData,
  variant = 'detailed',
  showProgress = true,
  className = '',
}) => {
  const t = useTranslations('DashboardPage');

  if (!membersData?.members || membersData.members.length === 0) {
    return null;
  }

  // Calculate member statistics
  const memberStats: MemberStats = {
    total: membersData.members.length,
    confirmed: membersData.members.filter(
      (member) => member.status === 'confirmed',
    ).length,
    pending: membersData.members.filter((member) => member.status === 'pending')
      .length,
    confirmationProgress: Math.round(
      (membersData.members.filter((member) => member.status === 'confirmed')
        .length /
        membersData.members.length) *
        100,
    ),
    roleBreakdown: {
      Chairman: membersData.members.filter(
        (member) => member.type === 'Chairman',
      ).length,
      Secretary: membersData.members.filter(
        (member) => member.type === 'Secretary',
      ).length,
      Member: membersData.members.filter((member) => member.type === 'Member')
        .length,
    },
  };

  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconUsers className="h-4 w-4 text-neutral-600" />
            <span className="text-sm font-medium">
              {t('memberStatus.title')}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {memberStats.confirmed}/{memberStats.total}{' '}
            {t('memberStatus.confirmed')}
          </Badge>
        </div>

        {showProgress && (
          <div className="space-y-1">
            <Progress
              value={memberStats.confirmationProgress}
              className="h-2"
            />
            <div className="flex gap-2 text-xs text-neutral-600">
              <span className="flex items-center gap-1">
                <IconUserCheck className="h-3 w-3 text-green-600" />
                {memberStats.confirmed} {t('memberStatus.confirmedShort')}
              </span>
              <span>•</span>
              <span>
                {memberStats.pending} {t('memberStatus.pendingShort')}
              </span>
              <span>•</span>
              <span>
                {memberStats.confirmationProgress}% {t('memberStatus.progress')}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card variant="success" className={`p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconUsers className="h-5 w-5 text-blue-600" />
          <span className="font-medium">{t('memberStatus.overview')}</span>
        </div>
        <Badge variant="outline" className="text-sm">
          {memberStats.confirmationProgress}% {t('memberStatus.confirmedLabel')}
        </Badge>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-4 space-y-2">
          <Progress value={memberStats.confirmationProgress} className="h-3" />
          <div className="flex justify-between text-xs text-neutral-600">
            <span>
              {memberStats.confirmed} {t('memberStatus.confirmedShort')}
            </span>
            <span>
              {memberStats.pending} {t('memberStatus.pendingShort')}
            </span>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-lg font-semibold">{memberStats.total}</div>
          <div className="text-neutral-600">
            {t('memberStatus.totalMembers')}
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {memberStats.confirmed}
          </div>
          <div className="text-neutral-600">
            {t('memberStatus.confirmedLabel')}
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-amber-600">
            {memberStats.pending}
          </div>
          <div className="text-neutral-600">
            {t('memberStatus.pendingLabel')}
          </div>
        </div>
      </div>

      {/* Role Breakdown */}
      <div className="border-t pt-3">
        <div className="mb-2 text-sm font-medium text-neutral-700">
          {t('memberStatus.roleDistribution')}
        </div>
        <div className="flex gap-4 text-xs">
          {memberStats.roleBreakdown.Chairman > 0 && (
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              {memberStats.roleBreakdown.Chairman} {t('memberStatus.chairman')}
            </span>
          )}
          {memberStats.roleBreakdown.Secretary > 0 && (
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              {memberStats.roleBreakdown.Secretary}{' '}
              {t('memberStatus.secretary')}
            </span>
          )}
          {memberStats.roleBreakdown.Member > 0 && (
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-gray-500"></div>
              {memberStats.roleBreakdown.Member} {t('memberStatus.members')}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export type { MemberSummaryProps, MemberStats };
