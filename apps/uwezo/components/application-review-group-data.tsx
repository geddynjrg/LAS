import { getFormatter, getTranslations } from "next-intl/server";
import type { FC } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { DataNode } from "@workspace/ui/components/data-node";

import type { GroupData } from "@/lib/data/application";

export const ApplicationReviewGroupData: FC<{
  groupData?: GroupData;
}> = async ({ groupData }) => {
  const t = await getTranslations("ApplicationDetailsPage");
  const format = await getFormatter();

  if (!groupData?.basics && !groupData?.location && !groupData?.background) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t("groupData.groupData")}</h4>
      <Accordion type="multiple" className="space-y-2">
        {groupData.basics && (
          <AccordionItem value="basics">
            <AccordionTrigger>
              {t("groupData.basicInfo.groupBasics")}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode label={t("groupData.basicInfo.groupName")}>
                  {groupData.basics.groupName}
                </DataNode>
                <DataNode label={t("groupData.basicInfo.registrationNumber")}>
                  {groupData.basics.groupRegistrationNumber}
                </DataNode>
                <DataNode label={t("groupData.basicInfo.dateFormed")}>
                  {format.dateTime(groupData.basics.dateFormed, {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })}
                </DataNode>
                <DataNode
                  label={t("groupData.basicInfo.groupRegistrationCert")}
                >
                  {groupData.basics.groupRegistrationCertificate.name}
                </DataNode>
                <DataNode label={t("groupData.basicInfo.listOfMembersOnCert")}>
                  {groupData.basics.listOfMembersOnCertificate.name}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {groupData.location && (
          <AccordionItem value="location">
            <AccordionTrigger>
              {t("groupData.locationInfo.locationOfTheGroup")}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode
                  label={t("groupData.locationInfo.countryOfOperation")}
                >
                  {groupData.location.countyOfOperation}
                </DataNode>
                <DataNode label={t("groupData.locationInfo.constituency")}>
                  {groupData.location.constituency}
                </DataNode>
                <DataNode label={t("groupData.locationInfo.ward")}>
                  {groupData.location.ward}
                </DataNode>
                <DataNode label={t("groupData.locationInfo.meetingPoint")}>
                  {groupData.location.meetingPoint}
                </DataNode>
                <DataNode label={t("groupData.locationInfo.nearestLandmark")}>
                  {groupData.location.nearestLandmark}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {groupData.background && (
          <AccordionItem value="background">
            <AccordionTrigger>
              {t("groupData.groupBackground.groupBackground")}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4">
                <DataNode
                  label={t("groupData.groupBackground.purposeOfTheGroup")}
                >
                  {groupData.background.purposeOfTheGroup}
                </DataNode>
                <DataNode
                  label={t("groupData.groupBackground.keyActivitiesOfGroup")}
                >
                  {groupData.background.keyActivitiesOfTheGroup}
                </DataNode>
                <DataNode label={t("groupData.groupBackground.creditHistory")}>
                  {groupData.background.groupCreditHistory.name}
                </DataNode>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};
