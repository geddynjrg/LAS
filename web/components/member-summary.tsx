import type { MembersData } from '@/lib/types/application.types';
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
  roleBreakdown: Record<string, number>;
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

  // Filter to only include members who require confirmation for statistics
  const membersRequiringConfirmation = membersData.members.filter(
    (member) => member.requiresConfirmation !== false,
  );

  // Calculate member statistics (only for members who require confirmation)
  const memberStats: MemberStats = {
    total: membersRequiringConfirmation.length,
    confirmed: membersRequiringConfirmation.filter(
      (member) => member.status === 'confirmed',
    ).length,
    pending: membersRequiringConfirmation.filter(
      (member) => member.status === 'pending',
    ).length,
    confirmationProgress:
      membersRequiringConfirmation.length > 0
        ? Math.round(
            (membersRequiringConfirmation.filter(
              (member) => member.status === 'confirmed',
            ).length /
              membersRequiringConfirmation.length) *
              100,
          )
        : 0,
    roleBreakdown: membersData.members.reduce(
      (acc, member) => {
        const type = member.type || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
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
        <div className="flex flex-wrap gap-4 text-xs">
          {Object.entries(memberStats.roleBreakdown).map(
            ([role, count], index) => {
              const colors = [
                'bg-blue-500',
                'bg-purple-500',
                'bg-green-500',
                'bg-orange-500',
                'bg-pink-500',
                'bg-teal-500',
                'bg-gray-500',
              ];
              const colorClass = colors[index % colors.length];
              return (
                <span key={role} className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${colorClass}`}></div>
                  {count} {role}
                </span>
              );
            },
          )}
        </div>
      </div>
    </Card>
  );
};

export type { MemberSummaryProps, MemberStats };
