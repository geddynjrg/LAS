import { ApplyFormStepper } from '@/app/apply/[id]/apply-form-stepper';
import { getApplicationById } from '@/lib/data/application';
import { getSession } from '@/lib/session';
import type { Step } from '@workspace/ui/components/stepper';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

export interface ApplyLayoutProps {
  params: Promise<{ id: string }>;
  children?: ReactNode;
}

export default async function IdLayout({ params, children }: ApplyLayoutProps) {
  const { id } = await params;
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    redirect(`/login?callbackUrl=/apply/${id}`);
  }

  const application = await getApplicationById(id);

  const steps: Step[] = [
    {
      index: 1,
      title: t('ApplicationDetailsPage.groupData.groupData'),
      path: '/group-data',
    },
    {
      index: 2,
      title: t('ApplicationDetailsPage.groupData.steps.groupMembers'),
      path: '/members',
    },
    {
      index: 3,
      title: t('ApplicationDetailsPage.loan.loanConditions'),
      path: '/loan-conditions',
    },
    {
      index: 4,
      title: t('ApplicationDetailsPage.proposedBusiness.proposedBusiness'),
      path: '/proposed-business',
    },
    {
      index: 5,
      title: t('ConfirmationsPage.form-title-members'), // Use existing key
      path: '/member-confirmation',
    },
    {
      index: 6,
      title: t('ApplicationDetailsPage.groupData.steps.confirmations'),
      path: '/confirmations',
    },
    {
      index: 7,
      title: t('ReviewPage.title'),
      path: '/review',
    },
  ];

  return (
    <>
      <ApplyFormStepper
        steps={steps}
        applicationProgress={
          application?.generalDetails.applicationProgress ?? 0
        }
        baseUrl={`/apply/${id}`}
      />

      {children}
    </>
  );
}
