// app/apply/[id]/member-confirmation/member-confirmation-form.tsx
'use client';

import { ApplyFormActionBar } from '@/app/apply/[id]/apply-form-action-bar';
import {
  memberConfirmationAction,
  sendMemberOtp,
  verifyMemberOtp,
} from '@/app/apply/[id]/member-confirmation/actions';
import { memberConfirmationSchema } from '@/app/apply/[id]/member-confirmation/member-confirmation-schema';
import type { Member } from '@/lib/types/application.types';
import { Button } from '@workspace/ui/components/button';
import { Container } from '@workspace/ui/components/container';
import { Form } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { FormCard } from '@workspace/ui/components/uwezo/form-card';
import { useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import { type FC, type ReactNode, useEffect, useState } from 'react';

// app/apply/[id]/member-confirmation/member-confirmation-form.tsx

// app/apply/[id]/member-confirmation/member-confirmation-form.tsx

// app/apply/[id]/member-confirmation/member-confirmation-form.tsx

// app/apply/[id]/member-confirmation/member-confirmation-form.tsx

// app/apply/[id]/member-confirmation/member-confirmation-form.tsx

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

  const [, formAction, isPending] = useForm(
    memberConfirmationAction,
    memberConfirmationSchema,
    {
      id,
      redirectTo: `/apply/${id}/confirmations`,
    },
  );

  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [confirmedCount, setConfirmedCount] = useState(initialConfirmedCount);
  const [, setIsThresholdMet] = useState(initialIsThresholdMet);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({});
  const [otpSuccess, setOtpSuccess] = useState<Record<string, string>>({});
  const [sendingOtpFor, setSendingOtpFor] = useState<Record<string, boolean>>(
    {},
  );
  const [verifyingOtpFor, setVerifyingOtpFor] = useState<
    Record<string, boolean>
  >({});
  const [otpResendCountdown, setOtpResendCountdown] = useState<
    Record<string, number>
  >({});

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

  useEffect(() => {
    setMembers(initialMembers);
    setConfirmedCount(initialConfirmedCount);
    setIsThresholdMet(initialIsThresholdMet);

    const newRespondedCount = initialMembers.filter(
      (member) =>
        member.confirmation_status &&
        member.confirmation_status !== 'pending' &&
        member.confirmation_status !== 'sent',
    ).length;
    setRespondedCount(newRespondedCount);
  }, [initialMembers, initialConfirmedCount, initialIsThresholdMet]);

  const minRequiredResponses = Math.ceil(totalMembers * 0.75);
  const hasEnoughResponses = respondedCount >= minRequiredResponses;

  const respondedPercentage =
    totalMembers > 0 ? Math.round((respondedCount / totalMembers) * 100) : 0;

  const confirmationPercentage =
    totalMembers > 0 ? Math.round((confirmedCount / totalMembers) * 100) : 0;

  useEffect(() => {
    const activeCountdowns = Object.entries(otpResendCountdown).filter(
      ([, seconds]) => seconds > 0,
    );

    if (activeCountdowns.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setOtpResendCountdown((prev) => {
        const next = { ...prev };
        for (const [memberId, seconds] of Object.entries(prev)) {
          if (seconds > 0) {
            next[memberId] = seconds - 1;
          }
        }
        return next;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [otpResendCountdown]);

  const updateMemberData = (updatedMembers: Member[]) => {
    setMembers(updatedMembers);

    const newConfirmedCount = updatedMembers.filter(
      (member: Member) => member.confirmation_status === 'confirmed',
    ).length;
    setConfirmedCount(newConfirmedCount);

    const newRespondedCount = updatedMembers.filter(
      (member: Member) =>
        member.confirmation_status &&
        member.confirmation_status !== 'pending' &&
        member.confirmation_status !== 'sent',
    ).length;
    setRespondedCount(newRespondedCount);
    setIsThresholdMet(newRespondedCount >= minRequiredResponses);
  };

  const memberHasResponded = (member: Member) =>
    member.confirmation_status === 'confirmed' ||
    member.confirmation_status === 'declined';

  const handleSendMemberOtp = async (member: Member) => {
    const memberKey = member.nationalIdCode || member.phoneNumber;
    if (!memberKey || sendingOtpFor[memberKey]) {
      return;
    }

    if ((otpResendCountdown[memberKey] ?? 0) > 0) {
      return;
    }

    setSendingOtpFor((prev) => ({ ...prev, [memberKey]: true }));
    setOtpErrors((prev) => ({ ...prev, [memberKey]: '' }));
    setOtpSuccess((prev) => ({ ...prev, [memberKey]: '' }));

    try {
      const result = await sendMemberOtp(id, memberKey);

      if (result.success) {
        setOtpSuccess((prev) => ({
          ...prev,
          [memberKey]: result.message || 'OTP sent successfully.',
        }));
        setOtpResendCountdown((prev) => ({ ...prev, [memberKey]: 120 }));
        setMembers((prev) =>
          prev.map((item) =>
            (item.nationalIdCode || item.phoneNumber) === memberKey
              ? { ...item, confirmation_status: 'sent' }
              : item,
          ),
        );
      } else {
        const needReauth =
          (result as { needReauth?: boolean }).needReauth === true ||
          /session|log\s*in|jwt|expired/i.test(String(result.message || ''));
        setOtpErrors((prev) => ({
          ...prev,
          [memberKey]: needReauth
            ? result.message ||
              'Your login session expired. Please log out, sign in again, then tap Send OTP.'
            : result.message || 'Failed to send OTP.',
        }));
        if (needReauth && typeof window !== 'undefined') {
          // Soft prompt — do not hard-redirect mid-form without user action
          window.dispatchEvent(
            new CustomEvent('uwezo:session-expired', {
              detail: { source: 'member-confirmation-otp' },
            }),
          );
        }
      }
    } catch {
      setOtpErrors((prev) => ({
        ...prev,
        [memberKey]: 'Failed to send OTP.',
      }));
    } finally {
      setSendingOtpFor((prev) => ({ ...prev, [memberKey]: false }));
    }
  };

  const handleOtpInputChange = async (member: Member, rawValue: string) => {
    const memberKey = member.nationalIdCode || member.phoneNumber;
    if (!memberKey || memberHasResponded(member)) {
      return;
    }

    const value = rawValue.replace(/\D/g, '').slice(0, 6);
    setOtpInputs((prev) => ({ ...prev, [memberKey]: value }));
    setOtpErrors((prev) => ({ ...prev, [memberKey]: '' }));
    setOtpSuccess((prev) => ({ ...prev, [memberKey]: '' }));

    if (value.length !== 6 || verifyingOtpFor[memberKey]) {
      return;
    }

    setVerifyingOtpFor((prev) => ({ ...prev, [memberKey]: true }));

    try {
      const result = await verifyMemberOtp(id, memberKey, value);

      if (result.success) {
        const status =
          result.member?.confirmation_status === 'declined'
            ? ('declined' as const)
            : ('confirmed' as const);
        const updatedMembers = members.map((item) =>
          (item.nationalIdCode || item.phoneNumber) === memberKey
            ? { ...item, confirmation_status: status }
            : item,
        );
        updateMemberData(updatedMembers);
        setOtpSuccess((prev) => ({
          ...prev,
          [memberKey]: result.message || 'OTP verified successfully.',
        }));
      } else {
        const needReauth =
          (result as { needReauth?: boolean }).needReauth === true ||
          /session|log\s*in|jwt|expired/i.test(String(result.message || ''));
        setOtpErrors((prev) => ({
          ...prev,
          [memberKey]: needReauth
            ? result.message ||
              'Your login session expired. Please log out, sign in again, then retry OTP.'
            : result.message || 'Invalid OTP code.',
        }));
      }
    } catch {
      setOtpErrors((prev) => ({
        ...prev,
        [memberKey]: 'Failed to verify OTP.',
      }));
    } finally {
      setVerifyingOtpFor((prev) => ({ ...prev, [memberKey]: false }));
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
        color: 'bg-green-100 text-green-800',
        description: 'Member confirmed via OTP',
      },
      declined: {
        label: 'Declined ✗',
        color: 'bg-red-100 text-red-800',
        description: 'Member declined',
      },
      sent: {
        label: 'OTP Sent',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Waiting for OTP entry',
      },
      pending: {
        label: 'Pending',
        color: 'bg-gray-100 text-gray-800',
        description: 'OTP not sent yet',
      },
    } as const;

    const key = (
      status in statusConfig ? status : 'pending'
    ) as keyof typeof statusConfig;
    const config = statusConfig[key];

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

  const getMemberDisplayName = (member: Member) => {
    return member.fullname || 'Unknown Member';
  };

  const getMemberPhone = (member: Member) => {
    return member.phoneNumber || 'No phone number';
  };

  const getMemberRole = (member: Member) => {
    return member.type ? member.type.toLowerCase() : 'member';
  };

  const canProceed = hasEnoughResponses;

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
              Send a 6-digit OTP to each member, then enter the code they
              receive. When at least 75% of members have verified their OTP, you
              can proceed to the next step.
            </p>
            <p>
              {t.rich('ConfirmationsPage.confirmMembersForm.progress-saved', {
                strong: (chunks: ReactNode) => {
                  return <strong>{chunks}</strong>;
                },
              })}
            </p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="text-center mb-4">
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

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div
                  className={`rounded-lg p-2 ${canProceed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                >
                  <div className="font-semibold">Response Status</div>
                  <div>
                    {canProceed
                      ? 'Threshold met — you can proceed'
                      : `${respondedCount}/${totalMembers} members responded`}
                  </div>
                </div>
                <div
                  className={`rounded-lg p-2 ${canProceed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                >
                  <div className="font-semibold">
                    Members Confirmed ({confirmedCount}/{totalMembers})
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-1 mt-2">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        canProceed ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{
                        width: `${Math.min(confirmationPercentage, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {confirmationPercentage}% confirmed via OTP
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="rounded-t-lg border-b bg-gray-50 px-4 py-3">
              <h3 className="font-semibold text-gray-800">
                Member Status ({members.length} members)
              </h3>
            </div>
            <div className="divide-y">
              {members.map((member, index) => {
                const memberKey = member.nationalIdCode || member.phoneNumber;
                if (!memberKey) {
                  return null;
                }
                const hasResponded = memberHasResponded(member);
                const resendSeconds = otpResendCountdown[memberKey] ?? 0;
                const isLast = index === members.length - 1;

                return (
                  <div
                    key={memberKey || member.phoneNumber}
                    className={`px-4 py-4 space-y-3 ${isLast ? 'rounded-b-lg' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-4">
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

                    {!hasResponded && member.requiresConfirmation !== false ? (
                      <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={
                            !!sendingOtpFor[memberKey] || resendSeconds > 0
                          }
                          onClick={() => handleSendMemberOtp(member)}
                        >
                          {sendingOtpFor[memberKey]
                            ? t('Common.sending')
                            : resendSeconds > 0
                              ? `Resend in ${formatCountdown(resendSeconds)}`
                              : 'Send OTP'}
                        </Button>

                        <div className="flex-1">
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Enter 6-digit OTP
                          </label>
                          <Input
                            type="tel"
                            maxLength={6}
                            placeholder="000000"
                            value={otpInputs[memberKey] || ''}
                            disabled={!!verifyingOtpFor[memberKey]}
                            onChange={(event) =>
                              void handleOtpInputChange(
                                member,
                                event.target.value,
                              )
                            }
                            className="max-w-[180px] tracking-[0.3em] text-center font-mono"
                          />
                          {verifyingOtpFor[memberKey] ? (
                            <p className="mt-1 text-xs text-blue-600">
                              Verifying OTP...
                            </p>
                          ) : null}
                          {otpErrors[memberKey] ? (
                            <p className="mt-1 text-xs text-red-600">
                              {otpErrors[memberKey]}
                              {/log\s*in|session|jwt|expired/i.test(
                                otpErrors[memberKey],
                              ) ? (
                                <>
                                  {' '}
                                  <a
                                    href={`/login?callbackUrl=${encodeURIComponent(`/apply/${id}/member-confirmation`)}`}
                                    className="underline font-medium"
                                  >
                                    Log in again
                                  </a>
                                </>
                              ) : null}
                            </p>
                          ) : null}
                          {otpSuccess[memberKey] ? (
                            <p className="mt-1 text-xs text-green-600">
                              {otpSuccess[memberKey]}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </FormCard>
      </Container>

      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="redirectTo" value={nextUrl} />

      <ApplyFormActionBar
        disabled={!canProceed || isPending}
        prevUrl={prevUrl}
        nextUrl={nextUrl}
        nextTooltip={
          !hasEnoughResponses
            ? `Need ${minRequiredResponses - respondedCount} more member responses`
            : undefined
        }
      />
    </Form>
  );
};
