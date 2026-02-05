// app/apply/[id]/member-confirmation/member-confirmation-form.tsx
'use client';

import { ApplyFormActionBar } from '@/app/apply/[id]/apply-form-action-bar';
import {
  memberConfirmationAction,
  refreshApplicationData,
  sendMemberConfirmations,
} from '@/app/apply/[id]/member-confirmation/actions';
import {
  type MemberConfirmationData,
  memberConfirmationSchema,
} from '@/app/apply/[id]/member-confirmation/member-confirmation-schema';
import type { Member } from '@/lib/types/application.types';
import { IconCheck, IconRefresh, IconX } from '@tabler/icons-react';
import { Container } from '@workspace/ui/components/container';
import { Form } from '@workspace/ui/components/form';
import { FormCard } from '@workspace/ui/components/uwezo/form-card';
import { useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import { type FC, useEffect, useState } from 'react';

// app/apply/[id]/member-confirmation/member-confirmation-form.tsx

interface MemberConfirmationDataProps {
  id: string;
  members: Member[];
  confirmedCount: number;
  totalMembers: number;
  isThresholdMet: boolean;
}

export const MemberConfirmationForm: FC<MemberConfirmationDataProps> = ({
  id,
  members: initialMembers,
  confirmedCount: initialConfirmedCount,
  totalMembers,
  isThresholdMet: initialIsThresholdMet,
}) => {
  const t = useTranslations();

  // Use form hook for the form submission
  const [state, formAction, isPending] = useForm(
    memberConfirmationAction,
    memberConfirmationSchema,
    {
      id,
      redirectTo: `/apply/${id}/confirmations`,
    },
  );

  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message?: string;
    stats?: any;
    timestamp?: number;
  } | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  // State for dynamic updates
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [confirmedCount, setConfirmedCount] = useState(initialConfirmedCount);
  const [isThresholdMet, setIsThresholdMet] = useState(initialIsThresholdMet);

  // Refresh button states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [refreshMessage, setRefreshMessage] = useState<string>('');

  // tracking responses
  const [respondedCount, setRespondedCount] = useState(
    initialMembers.filter(
      (member) =>
        member.confirmation_status &&
        member.confirmation_status !== 'pending' &&
        member.confirmation_status !== 'sent',
    ).length,
  );

  const prevUrl = `/apply/${id}/proposed-business`;
  const nextUrl = `/apply/${id}/confirmations`;

  // Update local state when props change
  useEffect(() => {
    setMembers(initialMembers);
    setConfirmedCount(initialConfirmedCount);
    setIsThresholdMet(initialIsThresholdMet);

    // Calculate responded count
    const newRespondedCount = initialMembers.filter(
      (member) =>
        member.confirmation_status &&
        member.confirmation_status !== 'pending' &&
        member.confirmation_status !== 'sent',
    ).length;
    setRespondedCount(newRespondedCount);
  }, [initialMembers, initialConfirmedCount, initialIsThresholdMet]);

  // required thresholds
  const minRequiredResponses = Math.ceil(totalMembers * 0.75);
  const minRequiredConsents = Math.ceil(totalMembers * 0.75);

  // Check if we have enough responses (75% of members)
  const hasEnoughResponses = respondedCount >= minRequiredResponses;

  // Check if we have enough consents (75% of members must consent)
  const hasEnoughConsents = confirmedCount >= minRequiredConsents;

  const respondedPercentage =
    totalMembers > 0 ? Math.round((respondedCount / totalMembers) * 100) : 0;

  const confirmationPercentage =
    totalMembers > 0 ? Math.round((confirmedCount / totalMembers) * 100) : 0;

  // Countdown timer for resend - only starts when response is received
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Auto-hide success/error alerts after 1 minute
  useEffect(() => {
    if (sendResult?.timestamp) {
      const hideTimer = setTimeout(
        () => {
          setSendResult(null);
        },
        1 * 60 * 1000,
      ); // 1 minute

      return () => clearTimeout(hideTimer);
    }
  }, [sendResult]);

  // Auto-hide refresh status after 5 seconds
  useEffect(() => {
    if (refreshStatus !== 'idle') {
      const timer = setTimeout(() => {
        setRefreshStatus('idle');
        setRefreshMessage('');
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [refreshStatus]);

  const handleSendConfirmations = async () => {
    if (!canResend) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const result = await sendMemberConfirmations(id);

      // Refresh application data after sending SMS
      if (result.success) {
        const refreshResult = await refreshApplicationData(id);

        if (refreshResult.success && refreshResult.application) {
          const updatedApplication = refreshResult.application;
          if (updatedApplication.members) {
            updateMemberData(updatedApplication.members.members);
          }
        }
      }

      setSendResult({
        ...result,
        timestamp: Date.now(),
      });

      // Start countdown only after successful response
      if (result.success) {
        setCanResend(false);
        setCountdown(150); // 2 minutes 30 seconds
      } else {
        // If failed, allow immediate retry
        setCanResend(true);
      }
    } catch (error) {
      setSendResult({
        success: false,
        message: 'Failed to send confirmations',
        timestamp: Date.now(),
      });
      setCanResend(true); // Allow immediate retry on error
    } finally {
      setIsSending(false);
    }
  };

  // Helper function to update member data
  const updateMemberData = (updatedMembers: Member[]) => {
    setMembers(updatedMembers);

    // Recalculate confirmed count
    const newConfirmedCount = updatedMembers.filter(
      (member: Member) => member.confirmation_status === 'confirmed',
    ).length;
    setConfirmedCount(newConfirmedCount);

    // Recalculate responded count
    const newRespondedCount = updatedMembers.filter(
      (member: Member) =>
        member.confirmation_status &&
        member.confirmation_status !== 'pending' &&
        member.confirmation_status !== 'sent',
    ).length;
    setRespondedCount(newRespondedCount);

    // Check thresholds
    const newHasEnoughResponses = newRespondedCount >= minRequiredResponses;
    const newHasEnoughConsents = newConfirmedCount >= minRequiredConsents;

    // Update threshold met status
    setIsThresholdMet(newHasEnoughResponses && newHasEnoughConsents);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (member: Member) => {
    const status = member.confirmation_status || member.status || 'pending';

    const statusConfig = {
      confirmed: {
        label: 'Consented ✓',
        color: 'bg-green-100 text-green-800 border border-green-200',
        description: 'Agreed to loan',
      },
      declined: {
        label: 'Declined ✗',
        color: 'bg-red-100 text-red-800 border border-red-200',
        description: 'Declined loan',
      },
      pending: {
        label: 'No Response',
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        description: 'SMS not sent',
      },
      sent: {
        label: 'Awaiting Response',
        color: 'bg-blue-100 text-blue-800 border border-blue-200',
        description: 'SMS sent, waiting reply',
      },
      failed: {
        label: 'SMS Failed',
        color: 'bg-gray-100 text-gray-800 border border-gray-200',
        description: 'Failed to send SMS',
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <div className="flex flex-col items-end">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
        >
          {config.label}
        </span>
        <span className="text-xs text-gray-500 mt-1">{config.description}</span>
      </div>
    );
  };

  // Helper function to safely display member information
  const getMemberDisplayName = (member: Member) => {
    return member.fullname || 'Unknown Member';
  };

  const getMemberPhone = (member: Member) => {
    return member.phoneNumber || 'No phone number';
  };

  const getMemberRole = (member: Member) => {
    return member.type ? member.type.toLowerCase() : 'member';
  };

  // Manual refresh function
  const handleRefreshStatus = async () => {
    if (isRefreshing) return; // Prevent multiple clicks

    setIsRefreshing(true);
    setRefreshStatus('idle');
    setRefreshMessage('');

    try {
      const refreshResult = await refreshApplicationData(id);

      if (refreshResult.success && refreshResult.application) {
        const updatedApplication = refreshResult.application;
        if (updatedApplication.members) {
          updateMemberData(updatedApplication.members.members);

          // Calculate changes
          const newConfirmedCount = updatedApplication.members.members.filter(
            (member: Member) => member.confirmation_status === 'confirmed',
          ).length;
          const newRespondedCount = updatedApplication.members.members.filter(
            (member: Member) =>
              member.confirmation_status &&
              member.confirmation_status !== 'pending' &&
              member.confirmation_status !== 'sent',
          ).length;

          const confirmedChange = newConfirmedCount - confirmedCount;
          const respondedChange = newRespondedCount - respondedCount;

          // Set success message with details
          let message = 'Status updated successfully';
          if (confirmedChange > 0 || respondedChange > 0) {
            const changes = [];
            if (confirmedChange > 0)
              changes.push(
                `${confirmedChange} new consent${confirmedChange > 1 ? 's' : ''}`,
              );
            if (respondedChange > 0)
              changes.push(
                `${respondedChange} new response${respondedChange > 1 ? 's' : ''}`,
              );
            message = `Updated! ${changes.join(' and ')}`;
          } else {
            message = 'Status is up to date';
          }

          setRefreshStatus('success');
          setRefreshMessage(message);
        }
      } else {
        setRefreshStatus('error');
        setRefreshMessage(refreshResult.error || 'Failed to refresh status');
      }
    } catch (error) {
      console.error('Failed to refresh status:', error);
    } finally {
      // Always reset the refreshing state
      setIsRefreshing(false);
    }
  };

  const getAlertStyles = (result: any) => {
    const type = result.stats?.status_type;

    switch (type) {
      case 'partial':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      default:
        return 'bg-red-50 text-red-800 border-red-200';
    }
  };

  const getRefreshButtonClasses = () => {
    const baseClasses =
      'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200';

    if (isRefreshing) {
      return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-200 cursor-wait`;
    }

    if (refreshStatus === 'success') {
      return `${baseClasses} bg-green-100 text-green-700 border border-green-200 hover:bg-green-200`;
    }

    if (refreshStatus === 'error') {
      return `${baseClasses} bg-red-100 text-red-700 border border-red-200 hover:bg-red-200`;
    }

    return `${baseClasses} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm`;
  };

  const canProceed = hasEnoughResponses && hasEnoughConsents;

  return (
    <Form
      action={formAction}
      className="flex flex-col justify-between min-h-screen"
      autoComplete="on"
    >
      <Container className="space-y-8">
        <FormCard
          title={t('ConfirmationsPage.form-title-members')}
          className="space-y-6"
        >
          <div className="prose">
            <p>
              {t(
                'ConfirmationsPage.confirmMembersForm.confirmation-instructions',
              )}
            </p>
            <p>
              {t.rich('ConfirmationsPage.confirmMembersForm.progress-saved', {
                strong: (chunks) => {
                  return <strong>{chunks}</strong>;
                },
              })}
            </p>
          </div>

          {/* Confirmation Progress */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="text-center mb-4">
              {/* Response Progress */}
              <div className="mb-6">
                <div className="text-2xl font-bold text-blue-700 mb-2">
                  {respondedCount}/{totalMembers}
                </div>
                <div className="text-blue-600 font-medium mb-3">
                  Members Responded (at least {minRequiredResponses} required)
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      hasEnoughResponses ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(respondedPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{respondedPercentage}% responded</span>
                  <span
                    className={
                      hasEnoughResponses ? 'text-green-600 font-semibold' : ''
                    }
                  >
                    100%
                  </span>
                </div>
              </div>

              {/* Consent Progress - Only show when all have responded */}

              {/* Status Summary */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div
                  className={`p-2 rounded ${hasEnoughResponses ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                >
                  <div className="font-semibold">Response Status</div>
                  <div>
                    {respondedCount === totalMembers
                      ? 'Complete'
                      : 'In Progress'}
                  </div>
                </div>
                <div
                  className={`p-2 rounded ${canProceed ? 'bg-green-100 text-green-800' : hasEnoughResponses ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}
                >
                  <div className="font-semibold">
                    Members Consented (at least {minRequiredConsents} required)
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        hasEnoughConsents ? 'bg-green-600' : 'bg-orange-500'
                      }`}
                      style={{
                        width: `${Math.min(confirmationPercentage, 75)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{confirmationPercentage}% consented</span>
                    <span
                      className={
                        hasEnoughConsents
                          ? 'text-green-600 font-semibold'
                          : 'text-orange-600'
                      }
                    >
                      {hasEnoughConsents
                        ? '✓ Threshold Met'
                        : '75% consent required'}
                    </span>
                  </div>
                  <div>
                    {hasEnoughConsents
                      ? 'Approved'
                      : respondedCount === totalMembers
                        ? 'Review Needed'
                        : 'Waiting for Responses'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Members List with Refresh Button */}
          <div className="border rounded-lg">
            <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">
                Member Status ({members.length} members)
              </h3>
              {/* <button
                type="button"
                onClick={handleRefreshStatus}
                className="text-sm bg-white hover:bg-gray-100 text-gray-700 px-3 py-1 rounded border border-gray-300 transition-colors"
              >
                Refresh Status
              </button> */}
              <div className="flex items-center gap-3">
                {/* Refresh Status Indicator */}
                {refreshStatus !== 'idle' && (
                  <div
                    className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${
                      refreshStatus === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {refreshStatus === 'success' ? (
                      <IconCheck size={16} />
                    ) : (
                      <IconX size={16} />
                    )}
                    <span className="font-medium">
                      {refreshMessage ||
                        (refreshStatus === 'success' ? 'Updated!' : 'Error')}
                    </span>
                  </div>
                )}

                {/* Enhanced Refresh Button */}
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={isRefreshing}
                  className={getRefreshButtonClasses()}
                  title="Refresh member status"
                >
                  {isRefreshing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <IconRefresh
                        size={18}
                        className={
                          refreshStatus === 'success' ? 'text-green-600' : ''
                        }
                      />
                      <span>Refresh Status</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="divide-y">
              {members.map((member, index) => (
                <div
                  key={index}
                  className="px-4 py-3 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {getMemberDisplayName(member)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getMemberPhone(member)}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {getMemberRole(member)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(member)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Send SMS Section */}
          <div className="text-center space-y-4 p-6 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSendConfirmations}
                disabled={isSending || !canResend}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  canResend && !isSending
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {isSending
                  ? t('Common.sending')
                  : !canResend
                    ? `Resend in ${formatCountdown(countdown)}`
                    : t('ConfirmationsPage.confirmMembersForm.send-to-members')}
              </button>

              {!canResend && (
                <div className="text-sm text-gray-600">
                  You can resend confirmation SMS in{' '}
                  {formatCountdown(countdown)}
                </div>
              )}
            </div>

            {/* Result Alert */}
            {sendResult && (
              <div
                className={`p-4 rounded-xl border-2 shadow-sm animate-in slide-in-from-bottom-2 duration-300 ${
                  sendResult.stats?.status_type === 'total_success'
                    ? 'bg-green-50 text-green-800 border-green-200'
                    : sendResult.stats?.status_type === 'partial_success'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : sendResult.stats?.status_type === 'info'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Dynamic Icon Section */}
                  <div className="mt-1">
                    {sendResult.stats?.status_type === 'total_success' && (
                      <IconCheck className="w-5 h-5 text-green-600" />
                    )}
                    {sendResult.stats?.status_type === 'partial_success' && (
                      <span className="text-xl">⚠️</span>
                    )}
                    {sendResult.stats?.status_type === 'info' && (
                      <span className="text-xl">ℹ️</span>
                    )}
                    {(sendResult.stats?.status_type === 'error' ||
                      !sendResult.success) && (
                      <IconX className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    {/* Dynamic Title Section */}
                    <div className="font-bold">
                      {sendResult.stats?.status_type === 'total_success' &&
                        'Notifications Sent'}
                      {sendResult.stats?.status_type === 'partial_success' &&
                        'Partial Delivery'}
                      {sendResult.stats?.status_type === 'info' &&
                        'Status Up to Date'}
                      {(!sendResult.stats?.status_type ||
                        sendResult.stats?.status_type === 'error') &&
                        'Delivery Failed'}
                    </div>

                    {/* The Human-Friendly Message from Drupal */}
                    <div className="text-sm opacity-90 leading-relaxed">
                      {sendResult.message}
                    </div>

                    {/* Stats Breakdown - Only show if there was actually an attempt */}
                    {sendResult.stats &&
                      (sendResult.stats.sms_sent > 0 ||
                        sendResult.stats.sms_failed > 0) && (
                        <div className="mt-2 flex gap-4 text-xs font-mono uppercase tracking-tighter font-semibold">
                          <span
                            className={
                              sendResult.stats.sms_sent > 0
                                ? 'text-green-700'
                                : 'text-gray-400'
                            }
                          >
                            Sent: {sendResult.stats.sms_sent}
                          </span>
                          {sendResult.stats.sms_failed > 0 && (
                            <span className="text-red-700">
                              Failed: {sendResult.stats.sms_failed}
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              SMS are sent via the Uwezo Fund. Members who have not yet
              responded will receive new confirmation links.
              {!canResend &&
                ` Wait ${formatCountdown(countdown)} before resending.`}
            </div>
          </div>
        </FormCard>
      </Container>

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="redirectTo" value={nextUrl} />

      {/* Action Bar - Only enable next if threshold is met */}
      <ApplyFormActionBar
        disabled={!canProceed || isPending}
        prevUrl={prevUrl}
        nextUrl={nextUrl}
        nextTooltip={
          !hasEnoughResponses
            ? `Need ${minRequiredResponses - respondedCount} more responses`
            : !hasEnoughConsents
              ? `Need ${minRequiredConsents - confirmedCount} more consents`
              : undefined
        }
      />
    </Form>
  );
};
