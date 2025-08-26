import { ReviewFooter } from '@/app/apply/[id]/review/review-footer';
import { ApplicationReviewGroupData } from '@/components/application-review-group-data';
import { ApplicationReviewLoanConditions } from '@/components/application-review-loan-conditions';
import { ApplicationReviewMembers } from '@/components/application-review-members';
import { ApplicationReviewProposedBusiness } from '@/components/application-review-proposed-business';
import { getApplicationById } from '@/lib/data/application-db';
import { Container } from '@workspace/ui/components/container';
import { InfoPopover } from '@workspace/ui/components/uwezo/info-popover';
import { getTranslations } from 'next-intl/server';

export interface GroupDataPageProps {
  params: Promise<{ id: string }>;
}

/* TODO: PAGE CURRENTLY UNUSED, REMOVE WHEN CLEAR IF THIS WILL NEVER BE USED AGAIN */

export default async function Page({ params }: GroupDataPageProps) {
  const { id } = await params;
  const t = await getTranslations();
  const application = await getApplicationById(id);

  if (!application) {
    // this should never happen
    return <div>Something went wrong. Please try again later</div>;
  }

  return (
    <div className="grow-1 flex flex-col justify-between">
      <Container className="pb-7">
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">{t('ReviewPage.title')}</h2>
            <p>{t('ReviewPage.subTitle')}</p>
          </div>
        </div>

        <ApplicationReviewLoanConditions
          loanConditionsData={application.loanConditions}
        />

        <ApplicationReviewMembers membersData={application.members} />

        <ApplicationReviewGroupData groupData={application.groupData} />

        <ApplicationReviewProposedBusiness
          businessDetails={
            application.proposedBusiness
              ? {
                  ...application.proposedBusiness,
                  customExpenses:
                    application.proposedBusiness.customExpenses || [],
                }
              : undefined
          }
        />
      </Container>

      <InfoPopover />
      <ReviewFooter id={id} />
    </div>
  );
}
