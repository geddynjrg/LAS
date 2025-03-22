"use client";

import { IconCheck } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FC } from "react";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Container } from "@workspace/ui/components/container";
import { DataNode } from "@workspace/ui/components/data-node";
import { DataPair } from "@workspace/ui/components/data-pair";
import { Field, Form, SubmitButton } from "@workspace/ui/components/form";
import { Loader } from "@workspace/ui/components/loader";
import { Card } from "@workspace/ui/components/uwezo/card";
import { FormCard } from "@workspace/ui/components/uwezo/form-card";
import { useForm, type FormAction } from "@workspace/ui/hooks/use-form";
import { cn } from "@workspace/ui/lib/utils";

import type { Member } from "@/actions/application";
import {
  membersConfirmationDataSchema,
  type MembersConfirmationData,
} from "@/actions/apply-form/members-confirmation-schema";
import { ApplyFormActionBar } from "@/app/apply/[id]/apply-form-action-bar";

export interface ConfirmMembersFormProps {
  id: string;
  action: FormAction<MembersConfirmationData>;
  onBack: () => void;
  members: Member[];
}

export const ConfirmationsMembersForm: FC<ConfirmMembersFormProps> = ({
  id,
  action,
  onBack,
  members,
}) => {
  const [state, formAction, isPending] = useForm(
    action,
    membersConfirmationDataSchema,
  );
  const [allChecked, setAllChecked] = useState(false);
  const [checkedMembers, setCheckedMembers] = useState<string[]>([]);
  const t = useTranslations();
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
  }, [state]);

  useEffect(() => {
    if (membersList.find((member) => member.status)) {
      // if members have status set, we have sent out confirmations
      setConfirmationSent(true);
    } else {
      setConfirmationSent(false);
    }
  });

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
      <Container className={cn("space-y-8")}>
        <FormCard
          title={t("ConfirmationsPage.form-title")}
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
              <SubmitButton
                className={cn("w-full max-w-[27rem]")}
                disabled={confirmationSent || checkedMembers.length === 0}
              >
                {t("ConfirmationsPage.confirmMembersForm.send-to-members")}
              </SubmitButton>
            </div>
          </div>
        </FormCard>
      </Container>

      <input type="hidden" name="id" value={id} />

      {/* TODO: Currently pass empty list to server, one day if needed to only sent to accepted users then pass on users id in the list */}
      <input type="hidden" name="membersConfirmation" value={"[]"} />

      <div className={cn("mt-auto")}>
        <ApplyFormActionBar
          disabled={isPending || !confirmationSent || isBelowConfirmThreshold}
          nextUrl={nextUrl}
          onBack={onBack}
        />
      </div>
    </Form>
  );
};
