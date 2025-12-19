import { FileLink } from '@/components/file-link';
import { MemberStatusIndicator } from '@/components/member-status-indicator';
import type { MembersData, Member } from '@/lib/types/application.types';
import { IconPencil, IconPhone } from '@tabler/icons-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import { DataNode } from '@workspace/ui/components/data-node';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { FC } from 'react';

export const ApplicationReviewMembers: FC<{
  membersData?: MembersData;
  applicationId?: string;
}> = ({ membersData, applicationId }) => {
  const t = useTranslations('ApplicationDetailsPage');

  if (!membersData?.members) {
    return null;
  }

  // Group members by role dynamically
  const groupedMembers = membersData.members.reduce(
    (acc, member) => {
      const type = member.type || 'Other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(member);
      return acc;
    },
    {} as Record<string, typeof membersData.members>,
  );

  const getMemberStatus = (member: Member): string => {
    const { status, confirmation_status, requiresConfirmation } = member;

    // Member doesn't need confirmation - use basic status
    if (!requiresConfirmation) {
      return status || 'pending';
    }

    // Member needs confirmation - complex logic
    if (status === 'confirmed') {
      switch (confirmation_status) {
        case 'confirmed':
          return 'confirmed'; // Member confirmed via SMS
        case 'declined':
          return 'declined'; // Member declined via SMS
        case 'failed':
          return 'SMS failed to send'; // SMS failed to send
        case 'pending':
          return 'Confirmation Not Sent'; // SMS not sent yet
        default:
          return 'confirmation_pending'; // SMS not sent yet
      }
    }

    // Status is pending
    if (status === 'pending') {
      switch (confirmation_status) {
        case 'sent':
          return 'Not Responded'; // SMS sent, waiting for response
        case 'failed':
          return 'SMS failed to send'; // SMS failed to send
        case 'pending':
        default:
          return 'SMS not sent yet'; // SMS not sent yet
      }
    }

    // Fallback
    return confirmation_status || 'pending';
};

  return (
    <div className="mt-6 grid">
      <div className="flex items-center justify-between pb-2">
        <h4 className="typo-h4">{t('members.members')}</h4>
        {applicationId && (
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/apply/${applicationId}/members`}>
              <IconPencil className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      {/* Member Statistics Summary */}
      {/* <MemberSummary
        membersData={membersData}
        variant="detailed"
        showProgress={true}
        className="mb-4"
      /> */}

      <Accordion collapsible type="single" className="space-y-2">
        <AccordionItem value="members">
          <AccordionTrigger>
            {t('members.members')} ({membersData.members.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              {/* Group by role */}
              {Object.entries(groupedMembers).map(
                ([role, members]) =>
                  members.length > 0 && (
                    <div key={role} className="space-y-3">
                      <h5 className="border-b pb-1 text-sm font-medium text-neutral-700">
                        {role} ({members.length})
                      </h5>
                      <div className="grid gap-3">
                        {members.map((member, index) => (
                          <div
                            key={`${member.nationalIdCode}-${index}`}
                            className="rounded-lg border bg-neutral-50 p-3"
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <DataNode
                                  label={member.fullname ?? ''}
                                  className="mb-0"
                                >
                                  {member.type}
                                </DataNode>
                              </div>
                              <MemberStatusIndicator
                                // i need to show member.confirmation_status, if member.status = confirmed && member.confirmation_status = sent then show Not Responded 
                                // if member.status = confirmed && member.confirmation_status = confirmed then show Confirmed
                                // if member.status = confirmed && member.confirmation_status = declined then show Declined
                                // if member.status = pending && member.confirmation_status = pending then show COnfirmation Sms not sent.
                                status={getMemberStatus(member)}
                                requiresConfirmation={
                                  member.requiresConfirmation
                                }
                                variant="badge"
                                size="sm"
                              />
                            </div>

                            <div className="mt-2 space-y-2 text-sm text-neutral-600">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {t('members.idLabel')}:
                                  </span>
                                  <span>{member.nationalIdCode}</span>
                                </div>
                                {/* economic activity */}
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {t('members.economicActivityLabel')}:
                                  </span>
                                  <span>{member.economicActivity}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">
                                    {t('members.genderLabel')}:
                                  </span>
                                  <span>{member.gender}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <IconPhone className="h-3 w-3" />
                                  <span>{member.phoneNumber}</span>
                                </div>
                                {member.requiresConfirmation && (
                                  <div className="flex items-center gap-1">
                                    <MemberStatusIndicator
                                      status={member.status || 'pending'}
                                      requiresConfirmation={
                                        member.requiresConfirmation
                                      }
                                      variant="icon"
                                      size="sm"
                                    />
                                    <span className="text-xs">
                                      {t('members.confirmationRequired')}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Member Files */}
                              <div className="space-y-1 border-t pt-2">
                                <div>
                                  <span className="font-medium text-xs text-neutral-700">
                                    {t('members.photoOfId')}:
                                  </span>
                                  <div className="ml-2">
                                    <FileLink file={member.photoOfId} />
                                  </div>
                                </div>
                                {member.disability && (
                                  <div>
                                    <span className="font-medium text-xs text-neutral-700">
                                      {t('members.disabilityCertificate')}:
                                    </span>
                                    <div className="ml-2">
                                      <FileLink
                                        file={
                                          member.disability
                                            .certificateOfDisability
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
