"use client";

import { useState } from "react";

import { confirmationDataAction } from "@/app/apply/[id]/confirmations/confirmation-data-action";
import { ConfirmationsDataForm } from "@/app/apply/[id]/confirmations/confirmations-data-form";
import { GroupConfirmationMembersForm } from "@/app/apply/[id]/confirmations/group-confirmation-members-form";
import { groupMembersConfirmationDataAction } from "@/app/apply/[id]/confirmations/group-members-confirmation-action";
import type {
  ApplicationData,
  ConfirmationsData,
  MembersData,
} from "@/lib/data/application";

export interface GroupConfirmationWrapperProps {
  id: string;
  applicationConfirmationData?: ConfirmationsData;
  members: MembersData;
  application: ApplicationData;
}

export default function GroupConfirmationWrapper({
  id,
  applicationConfirmationData,
  members,
  application,
}: GroupConfirmationWrapperProps) {
  const [step, setStep] = useState<"declaration" | "confirmation">(
    applicationConfirmationData?.declarations.correctInformationConfirm === "on"
      ? "confirmation"
      : "declaration",
  );

  return (
    <>
      {step === "declaration" && (
        <ConfirmationsDataForm
          id={id}
          action={confirmationDataAction}
          onSuccess={() => setStep("confirmation")}
          declarationsData={applicationConfirmationData?.declarations}
        />
      )}
      {step === "confirmation" && (
        <GroupConfirmationMembersForm
          id={id}
          action={groupMembersConfirmationDataAction}
          onBack={() => setStep("declaration")}
          members={members.members}
        />
      )}
    </>
  );
}
