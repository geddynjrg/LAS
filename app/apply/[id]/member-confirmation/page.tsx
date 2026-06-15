// app/apply/[id]/member-confirmation/page.tsx
import { MemberConfirmationForm } from './member-confirmation-form';
import { getApplicationById } from '@/lib/data/application';
import type { Member } from '@/lib/types/application.types';
import { getTranslations } from 'next-intl/server';
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

  if (!application.members) {
    throw new Error('Members data not found');
  }

  // Calculate confirmation progress
  const confirmedCount = application.members.members.filter(
    (member: Member) => member.confirmation_status === 'confirmed',
  ).length;
  const totalMembers = application.members.members.length;
  const confirmationPercentage = totalMembers > 0 
    ? Math.round((confirmedCount / totalMembers) * 100) 
    : 0;

  // Check if 75% threshold is met
  const isThresholdMet = confirmationPercentage >= 75;

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
                : t('ConfirmationsPage.confirmMembersForm.threshold-needed', { percentage: confirmationPercentage })
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