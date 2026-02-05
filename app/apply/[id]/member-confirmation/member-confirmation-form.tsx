// app/apply/[id]/member-confirmation/member-confirmation-form.tsx
'use client';

import { ApplyFormActionBar } from '@/app/apply/[id]/apply-form-action-bar';
import { 
  sendMemberConfirmations, 
  refreshApplicationData, 
  memberConfirmationAction 
} from '@/app/apply/[id]/member-confirmation/actions';
import { 
  memberConfirmationSchema,
  type MemberConfirmationData 
} from '@/app/apply/[id]/member-confirmation/member-confirmation-schema';
import { Container } from '@workspace/ui/components/container';
import { FormCard } from '@workspace/ui/components/uwezo/form-card';
import { Form } from '@workspace/ui/components/form';
import { useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import { type FC, useState, useEffect, JSXElementConstructor, ReactElement, ReactNode, ReactPortal } from 'react';
import type { Member } from '@/lib/types/application.types';

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
    }
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

  // tracking responses
  const [respondedCount, setRespondedCount] = useState(
    initialMembers.filter(member => 
      member.confirmation_status && member.confirmation_status !== 'pending' && member.confirmation_status !== 'sent'
    ).length
  );

  const prevUrl = `/apply/${id}/proposed-business`;
  const nextUrl = `/apply/${id}/confirmations`;

  // Update local state when props change
  useEffect(() => {
    setMembers(initialMembers);
    setConfirmedCount(initialConfirmedCount);
    setIsThresholdMet(initialIsThresholdMet);
    
    // Calculate responded count
    const newRespondedCount = initialMembers.filter(member => 
      member.confirmation_status && member.confirmation_status !== 'pending' && member.confirmation_status !== 'sent'
    ).length;
    setRespondedCount(newRespondedCount);
  }, [initialMembers, initialConfirmedCount, initialIsThresholdMet]);

  // Calculate if all members have responded
  const allMembersResponded = respondedCount === totalMembers && totalMembers > 0;
  const is75PercentMet = allMembersResponded && confirmedCount >= Math.ceil(totalMembers * 0.75);

  const respondedPercentage = totalMembers > 0 
    ? Math.round((respondedCount / totalMembers) * 100) 
    : 0;

  const confirmationPercentage = totalMembers > 0 
    ? Math.round((confirmedCount / totalMembers) * 100) 
    : 0;


  // Countdown timer for resend - only starts when response is received
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Auto-hide success/error alerts after 2 minutes
  useEffect(() => {
    if (sendResult?.timestamp) {
      const hideTimer = setTimeout(() => {
        setSendResult(null);
      }, 2 * 60 * 1000); // 2 minutes

      return () => clearTimeout(hideTimer);
    }
  }, [sendResult]);

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
            setMembers(updatedApplication.members.members);
            
            // Recalculate confirmed count
            const newConfirmedCount = updatedApplication.members.members.filter(
              (member: Member) => member.confirmation_status === 'confirmed'
            ).length;
            setConfirmedCount(newConfirmedCount);
            
            // Recalculate threshold
            const newConfirmationPercentage = totalMembers > 0 
              ? Math.round((newConfirmedCount / totalMembers) * 100) 
              : 0;
            setIsThresholdMet(newConfirmationPercentage >= 75);
          }
        }
      }

      setSendResult({
        ...result,
        timestamp: Date.now()
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
        timestamp: Date.now()
      });
      setCanResend(true); // Allow immediate retry on error
    } finally {
      setIsSending(false);
    }
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
        description: 'Agreed to loan'
      },
      declined: { 
        label: 'Declined ✗', 
        color: 'bg-red-100 text-red-800 border border-red-200',
        description: 'Declined loan'
      },
      pending: { 
        label: 'No Response', 
        color: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        description: 'SMS not sent'
      },
      sent: { 
        label: 'Awaiting Response', 
        color: 'bg-blue-100 text-blue-800 border border-blue-200',
        description: 'SMS sent, waiting reply'
      },
      failed: { 
        label: 'SMS Failed', 
        color: 'bg-gray-100 text-gray-800 border border-gray-200',
        description: 'Failed to send SMS'
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <div className="flex flex-col items-end">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
        <span className="text-xs text-gray-500 mt-1">
          {config.description}
        </span>
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
    try {
      const refreshResult = await refreshApplicationData(id);
      
      if (refreshResult.success && refreshResult.application) {
        const updatedApplication = refreshResult.application;
        if (updatedApplication.members) {
          setMembers(updatedApplication.members.members);
          
          const newConfirmedCount = updatedApplication.members.members.filter(
            (member: Member) => member.confirmation_status === 'confirmed'
          ).length;
          setConfirmedCount(newConfirmedCount);
          
          const newRespondedCount = updatedApplication.members.members.filter(
          (member: Member) => member.confirmation_status && member.confirmation_status !== 'pending' && member.confirmation_status !== 'sent'
          ).length;
          setRespondedCount(newRespondedCount);
          
          const allResponded = newRespondedCount === totalMembers && totalMembers > 0;
          const newIs75PercentMet = allResponded && newConfirmedCount >= Math.ceil(totalMembers * 0.75);
          setIsThresholdMet(newIs75PercentMet);
        }
      }
    } catch (error) {
      console.error('Failed to refresh status:', error);
    }
  };

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
            <p>{t('ConfirmationsPage.confirmMembersForm.confirmation-instructions')}</p>
            <p>
              {t.rich('ConfirmationsPage.confirmMembersForm.progress-saved', {
                strong: (chunks: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined) => <strong>{chunks}</strong>,
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
                  Members Responded
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      allMembersResponded ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(respondedPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{respondedPercentage}% responded</span>
                  <span className={allMembersResponded ? 'text-green-600 font-semibold' : ''}>
                    {allMembersResponded ? '✓ All Responded' : 'All must respond'}
                  </span>
                </div>
              </div>

              {/* Consent Progress - Only show when all have responded */}
              

              {/* Status Summary */}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className={`p-2 rounded ${allMembersResponded ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  <div className="font-semibold">Response Status</div>
                  <div>{allMembersResponded ? 'Complete' : 'In Progress'}</div>
                </div>
                <div className={`p-2 rounded ${is75PercentMet ? 'bg-green-100 text-green-800' : allMembersResponded ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                  <div className="font-semibold">Consent Status</div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        is75PercentMet ? 'bg-green-600' : 'bg-orange-500'
                      }`}
                      style={{ width: `${Math.min(confirmationPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{confirmationPercentage}% consented</span>
                    <span className={is75PercentMet ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                      {is75PercentMet ? '✓ Threshold Met' : '75% consent required'}
                    </span>
                  </div>
                  <div>
                    {is75PercentMet ? 'Approved' : 
                    allMembersResponded ? 'Review Needed' : 'Waiting for Responses'}
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
              <button
                type="button"
                onClick={handleRefreshStatus}
                className="text-sm bg-white hover:bg-gray-100 text-gray-700 px-3 py-1 rounded border border-gray-300 transition-colors"
              >
                Refresh Status
              </button>
            </div>
            <div className="divide-y">
              {members.map((member, index) => (
                <div key={index} className="px-4 py-3 flex justify-between items-center">
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
                  : t('ConfirmationsPage.confirmMembersForm.send-to-members')
                }
              </button>

              {!canResend && (
                <div className="text-sm text-gray-600">
                  You can resend confirmation SMS in {formatCountdown(countdown)}
                </div>
              )}
            </div>

            {/* Result Alert */}
            {sendResult && (
              <div 
                className={`p-4 rounded-lg border animate-in fade-in duration-300 ${
                  sendResult.success 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="font-semibold">
                    {sendResult.success ? '✓ Success' : '✗ Failed'}
                  </div>
                  {sendResult.stats && (
                    <div className="text-sm opacity-75">
                      • {sendResult.stats.sms_failed || 0} failed
                    </div>
                  )}
                </div>
                <div className="text-sm mt-1">
                  {sendResult.message}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              SMS are sent via the Uwezo Fund. Members who have not yet responded will receive new confirmation links.
              {!canResend && ` Wait ${formatCountdown(countdown)} before resending.`}
            </div>
          </div>
        </FormCard>
      </Container>

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="redirectTo" value={nextUrl} />

      {/* Action Bar - Only enable next if threshold is met */}
      <ApplyFormActionBar 
        disabled={!allMembersResponded || !is75PercentMet || isPending}
        prevUrl={prevUrl}
        nextUrl={nextUrl}
        nextTooltip={
          !allMembersResponded 
            ? `Waiting for ${totalMembers - respondedCount} more members to respond`
            : !is75PercentMet
            ? `Requires ${Math.ceil(totalMembers * 0.75)} consents (${confirmedCount}/${totalMembers})`
            : undefined
        }
      />
    </Form>
  );
};