import { IconArrowLeft } from "@tabler/icons-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { Container } from "@workspace/ui/components/container";

import { getApplicationById } from "@/actions/application";
import { ApplicationReviewGroupData } from "@/components/application-review-group-data";
import { ApplicationReviewLoanConditions } from "@/components/application-review-loan-conditions";
import { ApplicationReviewMembers } from "@/components/application-review-members";
import { ApplicationReviewProposedBusiness } from "@/components/application-review-proposed-business";
import { ApplicationStatus } from "@/components/application-status";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const t = await getTranslations("ApplicationDetailsPage");

  const { id } = await params;

  const data = await getApplicationById(id);

  if (!data) {
    return <div>{t("applicationNotFound")}</div>;
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
          {t("backToDashboard")}
        </Link>
      </Button>

      <div className="mt-6">
        <h2 className="typo-h2">{data.generalDetails.applicationId}</h2>
        <p className="font-bold">{t("status")}</p>
        <ApplicationStatus status={data.generalDetails.status} />
      </div>

      <ApplicationReviewLoanConditions
        loanConditionsData={data.loanConditions}
      />

      <ApplicationReviewMembers membersData={data.members} />

      <ApplicationReviewGroupData groupData={data.groupData} />

      <ApplicationReviewProposedBusiness
        businessDetails={data.proposedBusiness}
      />
    </Container>
  );
}
