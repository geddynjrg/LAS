import { useTranslations } from "next-intl";
import type { FC } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { DataNode } from "@workspace/ui/components/data-node";

import type { MembersData } from "@/lib/data/application";

export const ApplicationReviewMembers: FC<{ membersData?: MembersData }> = ({
  membersData,
}) => {
  const t = useTranslations("ApplicationDetailsPage");

  if (!membersData?.members) {
    return null;
  }

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t("members.members")}</h4>
      <Accordion collapsible type="single" className="space-y-2">
        <AccordionItem value="members">
          <AccordionTrigger>{t("members.members")}</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4">
              {membersData.members.map((member, index) => (
                <DataNode key={index} label={member.fullname ?? ""}>
                  {member.type}
                </DataNode>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
