import { IconPhone } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { DataNode } from "@workspace/ui/components/data-node";

import { MemberStatusIndicator } from "@/components/member-status-indicator";
// import { MemberSummary } from "@/components/member-summary";
import type { MembersData } from "@/lib/data/application";

export const ApplicationReviewMembers: FC<{ membersData?: MembersData }> = ({
  membersData,
}) => {
  const t = useTranslations("ApplicationDetailsPage");

  if (!membersData?.members) {
    return null;
  }

  // Group members by role
  const groupedMembers = {
    Chairman: membersData.members.filter(
      (member) => member.type === "Chairman",
    ),
    Secretary: membersData.members.filter(
      (member) => member.type === "Secretary",
    ),
    Member: membersData.members.filter((member) => member.type === "Member"),
  };

  return (
    <div className="mt-6 grid">
      <h4 className="typo-h4 pb-2">{t("members.members")}</h4>

      {/* Member Statistics Summary */}
      {/* <MemberSummary
        membersData={membersData}
        variant="detailed"
        showProgress={true}
        className="mb-4"
      /> */}

      <Accordion collapsible type="single" className="space-y-2">
        <AccordionItem value="members">
          <AccordionTrigger>
            {t("members.members")} ({membersData.members.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              {/* Group by role */}
              {Object.entries(groupedMembers).map(
                ([role, members]) =>
                  members.length > 0 && (
                    <div key={role} className="space-y-3">
                      <h5 className="border-b pb-1 text-sm font-medium text-neutral-700">
                        {role} ({members.length})
                      </h5>
                      <div className="grid gap-3">
                        {members.map((member, index) => (
                          <div
                            key={`${member.nationalIdCode}-${index}`}
                            className="rounded-lg border bg-neutral-50 p-3"
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <DataNode
                                  label={member.fullname ?? ""}
                                  className="mb-0"
                                >
                                  {member.type}
                                </DataNode>
                              </div>
                              <MemberStatusIndicator
                                status={member.status || "pending"}
                                variant="badge"
                                size="sm"
                              />
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-neutral-600">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  {t("members.idLabel")}:
                                </span>
                                <span>{member.nationalIdCode}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  {t("members.genderLabel")}:
                                </span>
                                <span>{member.gender}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <IconPhone className="h-3 w-3" />
                                <span>{member.phoneNumber}</span>
                              </div>
                              {member.requiresConfirmation && (
                                <div className="flex items-center gap-1">
                                  <MemberStatusIndicator
                                    status={member.status || "pending"}
                                    variant="icon"
                                    size="sm"
                                  />
                                  <span className="text-xs">
                                    {t("members.confirmationRequired")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
