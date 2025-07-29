"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";

import { type MembersConfirmationData } from "@/app/apply/[id]/confirmations/members-confirmation-schema";
import { updateApplicationMembersConfirmationData } from "@/lib/data/application-db";

export const membersConfirmationDataAction: FormAction<
  MembersConfirmationData
> = async (_prev, formData) => {
  const id = formData.get("id")?.toString();
  const redirectTo = formData.get("redirectTo")?.toString();

  // currently unused but will leave for future use
  let membersConfirmation;

  try {
    membersConfirmation = JSON.parse(
      formData.get("membersConfirmation")?.toString() || "[]",
    );
  } catch (error) {
    // TODO: Validate members properly when form is capable of handling it
    console.error("Error parsing members data", error);
    membersConfirmation = [];
  }

  if (!id) {
    throw new Error("No application ID provided");
  }

  if (!membersConfirmation) {
    throw new Error("No members confirmation provided");
  }

  // wait 3 seconds
  await new Promise((resolve) => setTimeout(resolve, 3000));

  /* Emulate members confirmations sent out and accepted */
  const members = await updateApplicationMembersConfirmationData(id);

  if (redirectTo) {
    redirect(redirectTo);
  }

  return {
    success: true,
    members,
  };
};
