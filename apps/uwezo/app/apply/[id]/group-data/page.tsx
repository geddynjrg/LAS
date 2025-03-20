import { getTranslations } from "next-intl/server";

import { Container } from "@workspace/ui/components/container";
import { InfoPopover } from "@workspace/ui/components/info-popover";

import { groupData } from "@/actions/apply-form/group-data";
import { GroupDataForm } from "@/app/apply/[id]/group-data/group-data-form";

export interface GroupDataPageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: GroupDataPageProps) {
  const { id } = await params;
  const t = await getTranslations();

  return (
    <>
      <Container>
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

      <GroupDataForm action={groupData} id={id} />
    </>
  );
}
