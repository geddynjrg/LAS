"use client";

import { useState } from "react";

import type { ConfirmationsData, MembersData } from "@/actions/application";
import { confirmationData } from "@/actions/apply-form/confirmation-data";
import { membersConfirmationData } from "@/actions/apply-form/members-confirmation";
import { ConfirmationsDataForm } from "@/app/apply/[id]/confirmations/confirmations-data-form";
import { ConfirmationsMembersForm } from "@/app/apply/[id]/confirmations/confirmations-members-form";

export interface GroupDataPageProps {
  id: string;
  applicationConfirmationData?: ConfirmationsData;
  members: MembersData;
}

export default function ConfirmationFormsWrapper({
  id,
  applicationConfirmationData,
  members,
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
          action={confirmationData}
          onSuccess={() => setStep("confirmation")}
          declarationsData={applicationConfirmationData?.declarations}
        />
      )}
      {step === "confirmation" && (
        <ConfirmationsMembersForm
          id={id}
          action={membersConfirmationData}
          onBack={() => setStep("declaration")}
          members={members.members}
        />
      )}
    </>
  );
}
