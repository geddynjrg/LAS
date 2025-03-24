import { getTranslations } from "next-intl/server";

import { Container } from "@workspace/ui/components/container";
import { InfoPopover } from "@workspace/ui/components/uwezo/info-popover";

import { getApplicationById } from "@/actions/application";
import { membersData } from "@/actions/apply-form/members-data";
import { MembersDataForm } from "@/app/apply/[id]/members/members-data-form";

export interface MembersPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: MembersPageProps) {
  const { id } = await params;
  const t = await getTranslations();
  const application = await getApplicationById(id);

  return (
    <>
      <Container className="pb-7">
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">{t("MembersPage.title")}</h2>
            <p>{t("MembersPage.subTitle")}</p>
          </div>
        </div>
      </Container>

      <InfoPopover />

      <MembersDataForm
        action={membersData}
        id={id}
        applicationMembersData={application?.members}
      />
    </>
  );
}
