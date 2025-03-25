import { getTranslations } from "next-intl/server";

import { Container } from "@workspace/ui/components/container";
import { InfoPopover } from "@workspace/ui/components/uwezo/info-popover";

import { groupDataAction } from "@/app/apply/[id]/group-data/group-data-action";
import { GroupDataForm } from "@/app/apply/[id]/group-data/group-data-form";
import { getApplicationById } from "@/lib/data/application";

export interface GroupDataPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: GroupDataPageProps) {
  const { id } = await params;
  const t = await getTranslations();
  const application = await getApplicationById(id);

  return (
    <>
      <Container className="pb-7">
        <div className="mt-4 flex flex-row justify-between">
          <div>
            <p>{id}</p>
            <h2 className="typo-h2">
              {t("ApplicationDetailsPage.groupData.groupData")}
            </h2>
          </div>
        </div>
      </Container>

      <InfoPopover />
      <GroupDataForm
        action={groupDataAction}
        id={id}
        applicationGroupData={application?.groupData}
      />
    </>
  );
}
