"use client";

import { IconCheck } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Container } from "@workspace/ui/components/container";
import { DataNode } from "@workspace/ui/components/data-node";
import { DataPair } from "@workspace/ui/components/data-pair";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Loader } from "@workspace/ui/components/loader";
import { ModalButton } from "@workspace/ui/components/modal-button";
import { Card } from "@workspace/ui/components/uwezo/card";
import { FormCard } from "@workspace/ui/components/uwezo/form-card";
import { InfoPopover } from "@workspace/ui/components/uwezo/info-popover";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";
import { cn } from "@workspace/ui/lib/utils";

import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";
import {
  membersConfirmationDataSchema,
  type MembersConfirmationData,
} from "@/app/apply/[id]/confirmations/members-confirmation-schema";
import { updateApplicationStatusById } from "@/app/apply/[id]/review/update-application-status-by-id-action";
import { ApplicationReviewGroupData } from "@/components/application-review-group-data";
import { ApplicationReviewLoanConditions } from "@/components/application-review-loan-conditions";
import { ApplicationReviewMembers } from "@/components/application-review-members";
import { ApplicationReviewProposedBusiness } from "@/components/application-review-proposed-business";
import type { ApplicationData, Member } from "@/lib/data/application";

export interface ConfirmMembersFormProps {
  id: string;
  action: FormAction<MembersConfirmationData>;
  onBack: () => void;
  members: Member[];
  application: ApplicationData;
}

export const ConfirmationsMembersForm: FC<ConfirmMembersFormProps> = ({
  id,
  action,
  onBack,
  members,
  application,
}) => {
  const [state, formAction, isPending] = useForm(
    action,
    membersConfirmationDataSchema,
  );
  const [allChecked, setAllChecked] = useState(false);
  const [checkedMembers, setCheckedMembers] = useState<string[]>([]);
  const t = useTranslations();
  const router = useRouter();
  const [confirmationSent, setConfirmationSent] = useState<boolean>();
  const [membersList, setMembersList] = useState<Member[]>(members);
  const [isBelowConfirmThreshold, setIsBelowConfirmThreshold] = useState(
    Math.ceil(members.length * 0.7) >
      members.map((member) => member.status === "confirmed").length,
  );

  const nextUrl = `/apply/${id}/review`;

  const confirmedMembers = membersList.filter(
    (member) => member.status === "confirmed",
  ).length;

  // manage confirmation state after successful submission
  useEffect(() => {
    if (state.success) {
      setMembersList(Array.isArray(state?.members) ? state.members : []);
      setConfirmationSent(true);
      setIsBelowConfirmThreshold(
        Math.ceil(membersList.length * 0.7) >
          membersList.map((member) => member.status === "confirmed").length,
      );
    }
  }, [state, membersList]);

  useEffect(() => {
    if (membersList.find((member) => member.status)) {
      // if members have status set, we have sent out confirmations
      setConfirmationSent(true);
    } else {
      setConfirmationSent(false);
    }
  }, [membersList]);

  // allow view to determine what stage of the confirmation process we are in and what to render
  if (confirmationSent === undefined) {
    return null;
  }

  return (
    <Form
      action={formAction}
      autoComplete="on"
      className={cn("grow-1 flex flex-col justify-between")}
    >
      <div className="grow-1 flex flex-col justify-between">
        <Container className="pb-7">
          <FormCard title={t("ReviewPage.title")}>
            <div className="mt-4 flex flex-row justify-between">
              <div>
                {/* <h2 className="typo-h3">{t("ReviewPage.title")}</h2> */}
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
          </FormCard>
        </Container>

        <InfoPopover />
      </div>

      <Container className={cn("space-y-8")}>
        <FormCard
          title={t("ConfirmationsPage.form-title-members")}
          className="space-y-4"
        >
          <Card variant="blue" className={cn("text-sm")}>
            {t(
              "ConfirmationsPage.confirmMembersForm.confirmation-instructions",
            )}
          </Card>

          {confirmationSent && (
            <Card variant="green" className={cn("text-sm")}>
              {t.rich("ConfirmationsPage.confirmMembersForm.progress-saved", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </Card>
          )}

          {confirmationSent ? (
            <h5 className={cn("typo-h5 text-center")}>
              {t("ConfirmationsPage.confirmMembersForm.confirmed-members", {
                confirmed: confirmedMembers,
                total: membersList.length,
              })}
            </h5>
          ) : (
            <h5 className={cn("typo-h5")}>
              {t("ConfirmationsPage.confirmMembersForm.select-members")}
            </h5>
          )}

          {!confirmationSent && (
            <div className={cn("max-sm:flex max-sm:justify-center")}>
              <Button
                className={cn("max-sm:w-full max-sm:max-w-[27rem]")}
                variant="secondary"
                type="button"
                onClick={() => {
                  setCheckedMembers(
                    checkedMembers.length === membersList.length
                      ? []
                      : membersList.map(
                          (member) => member.nationalIdCode ?? "",
                        ),
                  );
                  setAllChecked(!allChecked);
                }}
              >
                {t("ConfirmationsPage.confirmMembersForm.select-all")}
              </Button>
            </div>
          )}

          <div key={allChecked ? "on" : "off"} className={cn("space-y-3")}>
            {membersList.map((member, index) => (
              <DataPair
                key={index}
                className={cn(
                  "w-full",
                  "border-t border-solid border-neutral-400",
                  "pt-3",
                )}
              >
                {confirmationSent || isPending ? (
                  <DataNode label={member.fullname ?? ""}>
                    {member.type}
                  </DataNode>
                ) : (
                  <Field
                    name="membersConfirm"
                    required
                    control={(props) => (
                      <Checkbox
                        {...props}
                        defaultValue={checkedMembers.includes(
                          member.nationalIdCode ?? "",
                        )}
                        onValueChange={(value) => {
                          if (value) {
                            const newCheckedList = [
                              ...checkedMembers,
                              member.nationalIdCode ?? "",
                            ];

                            setCheckedMembers(newCheckedList);

                            if (newCheckedList.length === membersList.length) {
                              setAllChecked(true);
                            }
                          } else {
                            setAllChecked(false);
                            // Remove the member from the list of checked members
                            setCheckedMembers(
                              checkedMembers.filter(
                                (checkedMember) =>
                                  checkedMember !== member.nationalIdCode,
                              ),
                            );
                          }
                        }}
                      >
                        <DataNode label={member.fullname ?? ""}>
                          {member.type}
                        </DataNode>
                      </Checkbox>
                    )}
                  />
                )}
                {confirmationSent && !isPending && (
                  <div className={cn("flex items-center gap-2")}>
                    {member.status === "confirmed" ? (
                      <IconCheck className={cn("text-green-400", "h-8 w-8")} />
                    ) : (
                      <>
                        <Button variant="secondary" size="sm" type="submit">
                          {t("Common.resend")}
                        </Button>
                        <Loader size={32} animation="strong" />
                      </>
                    )}
                  </div>
                )}

                {isPending &&
                  (member.status === "confirmed" ? (
                    <IconCheck className={cn("text-green-400", "h-8 w-8")} />
                  ) : (
                    <div className={cn("flex items-center gap-2")}>
                      <Loader size={32} animation="strong" />
                    </div>
                  ))}
              </DataPair>
            ))}
            <div
              className={cn(
                "border-t border-solid border-neutral-400",
                "pt-4",
                "flex justify-center",
              )}
            >
              <ModalButton
                disabled={confirmationSent || checkedMembers.length === 0}
                onConfirm={() => {
                  updateApplicationStatusById(id);
                  router.push(`/apply/${id}/done`);
                }}
                cancelTitle={t("Common.back")}
                confirmTitle={t("Common.submit")}
                modalText={t("ReviewPage.confirmationDescription")}
                modalTitle={t("ReviewPage.confirmationTitle")}
                cancelButtonProps={{ variant: "secondary" }}
                contentProps={{ size: "sm" }}
                titleUnderline
                className={cn("w-full max-w-[27rem]")}
              >
                {t("ConfirmationsPage.confirmMembersForm.send-to-members")}
              </ModalButton>
            </div>
          </div>
        </FormCard>
      </Container>

      <input type="hidden" name="id" value={id} />

      {/* TODO: Currently pass empty list to server, one day if needed to only sent to accepted users then pass on users id in the list */}
      <input type="hidden" name="membersConfirmation" value={"[]"} />

      <ApplyFormActionBar onBack={onBack} hideNext />
    </Form>
  );
};
