import { getTranslations } from "next-intl/server";

import { Container } from "@workspace/ui/components/container";
import { InfoPopover } from "@workspace/ui/components/uwezo/info-popover";

import { getApplicationById } from "@/actions/application";
import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";
import { ApplyFormModalActionBar } from "@/app/apply/[id]/apply-form-modal-action-bar";
import { ApplicationReviewGroupData } from "@/components/application-review-group-data";
import { ApplicationReviewLoanConditions } from "@/components/application-review-loan-conditions";
import { ApplicationReviewMembers } from "@/components/application-review-members";
import { ApplicationReviewProposedBusiness } from "@/components/application-review-proposed-business";

export interface GroupDataPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: GroupDataPageProps) {
  const { id } = await params;
  const t = await getTranslations();
  const application = await getApplicationById(id);

  if (!application) {
    // this should never happen
    return <div>Something went wrong. Please try again later</div>;
  }

  const prevUrl = `/apply/${id}/confirmations`;
  const nextUrl = `/apply/${id}/done`;

  return (
    <>
      <Container className="pb-7">
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">{t("ReviewPage.title")}</h2>
            <p>{t("ReviewPage.subTitle")}</p>
          </div>
        </div>

        <ApplicationReviewLoanConditions
          loanConditionsData={application.loanConditions}
        />

        <ApplicationReviewMembers membersData={application.members} />

        <ApplicationReviewGroupData groupData={application.groupData} />

        <ApplicationReviewProposedBusiness
          businessDetails={application.proposedBusiness}
        />
      </Container>

      <InfoPopover />

      <ApplyFormModalActionBar nextUrl={nextUrl} prevUrl={prevUrl} />
    </>
  );
}
