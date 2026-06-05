import { ApplicationReviewGroupData } from '@/components/application-review-group-data';
import { ApplicationReviewLoanConditions } from '@/components/application-review-loan-conditions';
import { ApplicationReviewMembers } from '@/components/application-review-members';
import { ApplicationReviewProposedBusiness } from '@/components/application-review-proposed-business';
import { ApplicationStatus } from '@/components/application-status';
import { LoanRepayModal } from '@/components/loan-repay-modal';
import { TrainingCertificateDownload } from '@/components/training-certificate-download';
import { getApplicationById } from '@/lib/data/application';
import { IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@workspace/ui/components/button';
import { Container } from '@workspace/ui/components/container';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const t = await getTranslations('ApplicationDetailsPage');

  const { id } = await params;

  const data = await getApplicationById(id);

  if (!data) {
    return <div>{t('applicationNotFound')}</div>;
  }

  return (
    <Container className="pb-8">
      <Button
        variant="secondary"
        className="mt-4 text-neutral-700 max-md:w-full"
        asChild
      >
        <Link href={`/dashboard`}>
          <IconArrowLeft />
          {t('backToDashboard')}
        </Link>
      </Button>

      <div className="mt-6 space-y-2">
        <h2 className="typo-h2">{data.generalDetails.applicationId}</h2>
        <p className="font-bold">{t('status')}</p>
        <ApplicationStatus
          status={data.generalDetails.status}
          rejectionDetails={data.generalDetails.rejectionDetails}
        />
        <div className="space-y-3 pt-4">
          <TrainingCertificateDownload
            applicationId={data.generalDetails.applicationId}
          />
          {(data.generalDetails.status === 'APPROVED' ||
            data.generalDetails.status === 'DISBURSED') &&
          data.loanConditions?.loanAmount ? (
            <LoanRepayModal
              applicationId={data.generalDetails.applicationId}
              loanAmount={data.loanConditions.loanAmount}
              repaymentPeriod={data.loanConditions.repaymentPeriod}
            />
          ) : null}
        </div>
      </div>

      <ApplicationReviewLoanConditions
        loanConditionsData={data.loanConditions}
      />

      <ApplicationReviewMembers membersData={data.members} />

      <ApplicationReviewGroupData groupData={data.groupData} />

      <ApplicationReviewProposedBusiness
        businessDetails={
          data.proposedBusiness
            ? {
                ...data.proposedBusiness,
                customExpenses: data.proposedBusiness.customExpenses || [],
              }
            : undefined
        }
      />
    </Container>
  );
}
