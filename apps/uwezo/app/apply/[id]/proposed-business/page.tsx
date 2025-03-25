import { getTranslations } from "next-intl/server";

import { Container } from "@workspace/ui/components/container";
import { InfoPopover } from "@workspace/ui/components/uwezo/info-popover";

import { proposedBusinessAction } from "@/app/apply/[id]/proposed-business/proposed-business-action";
import { ProposedBusinessDataForm } from "@/app/apply/[id]/proposed-business/proposed-business-data-form";
import { getApplicationById } from "@/lib/data/application";

export interface ProposedBusinessPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: ProposedBusinessPageProps) {
  const t = await getTranslations();
  const { id } = await params;
  const application = await getApplicationById(id);

  return (
    <>
      <Container className="pb-7">
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">
              {t("ApplicationDetailsPage.loan.loanConditions")}
            </h2>
          </div>
        </div>
      </Container>

      <InfoPopover />
      <ProposedBusinessDataForm
        action={proposedBusinessAction}
        id={id}
        applicationBusinessData={application?.proposedBusiness}
      />
    </>
  );
}
