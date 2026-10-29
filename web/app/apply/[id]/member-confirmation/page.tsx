// app/apply/[id]/member-confirmation/page.tsx
import { MemberConfirmationForm } from './member-confirmation-form';
import { getApplicationById } from '@/lib/data/application';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Container } from '@workspace/ui/components/container';
import { InfoPopover } from '@workspace/ui/components/uwezo/info-popover';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberConfirmationPage({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations();
  
  const application = await getApplicationById(id);

  if (!application) {
    throw new Error('Application not found');
  }

  if (!application.members?.members?.length) {
    // No members saved yet — send applicant back to the members step.
    redirect(`/apply/${id}/members`);
  }

  const members = application.members.members;
  const confirmedCount = members.filter(
    (member) => member.confirmation_status === 'confirmed',
  ).length;
  const totalMembers = members.length;
  const respondedCount = members.filter(
    (member) =>
      member.confirmation_status &&
      member.confirmation_status !== 'pending' &&
      member.confirmation_status !== 'sent',
  ).length;
  const respondedPercentage =
    totalMembers > 0
      ? Math.round((respondedCount / totalMembers) * 100)
      : 0;

  // 75% of members must have responded (confirmed or declined) to proceed
  const isThresholdMet = respondedPercentage >= 75;

  return (
    <>
      <Container className="container pb-7">
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">{t('ConfirmationsPage.form-title-members')}</h2>
            <p className="text-gray-600 mt-2">
              {isThresholdMet 
                ? t('ConfirmationsPage.confirmMembersForm.threshold-met')
                : t('ConfirmationsPage.confirmMembersForm.threshold-needed', { percentage: respondedPercentage })
              }
            </p>
          </div>
        </div>
      </Container>

      <MemberConfirmationForm
        id={id}
        members={application.members.members}
        confirmedCount={confirmedCount}
        totalMembers={totalMembers}
        isThresholdMet={isThresholdMet}
      />
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const t = await getTranslations('ConfirmationsPage');
  
  return {
    title: t('form-title-members'),
  };
}