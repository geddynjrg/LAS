"use client";

import { useState } from "react";

import { confirmationDataAction } from "@/app/apply/[id]/confirmations/confirmation-data-action";
import { ConfirmationsDataForm } from "@/app/apply/[id]/confirmations/confirmations-data-form";
import { ConfirmationsMembersForm } from "@/app/apply/[id]/confirmations/confirmations-members-form";
import { membersConfirmationDataAction } from "@/app/apply/[id]/confirmations/members-confirmation-action";
import type {
  ApplicationData,
  ConfirmationsData,
  MembersData,
} from "@/lib/data/application";

export interface GroupDataPageProps {
  id: string;
  applicationConfirmationData?: ConfirmationsData;
  members: MembersData;
  application: ApplicationData;
}

export default function ConfirmationFormsWrapper({
  id,
  applicationConfirmationData,
  members,
  application,
}: GroupDataPageProps) {
  const [step, setStep] = useState<"declaration" | "confirmation">(
    applicationConfirmationData?.declarations.correctInformationConfirm === "on" // all fields have to be checked so we can just check one and decide what view to show
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
        <ConfirmationsMembersForm
          id={id}
          application={application}
          action={membersConfirmationDataAction}
          onBack={() => setStep("declaration")}
          members={members.members}
        />
      )}
    </>
  );
}
