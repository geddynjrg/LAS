"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";

import {
  membersDataSchema,
  type MembersData,
} from "@/app/apply/[id]/members/members-data-schema";
import { updateApplicationMembersData } from "@/lib/data/application-db";

export const membersDataAction: FormAction<MembersData> = async (
  _prev,
  formData,
) => {
  const redirectTo = formData.get("redirectTo")?.toString();
  const id = formData.get("id")?.toString();

  // Prepare data for validation including members
  const formValues = {
    natureOfGroup: formData.get("natureOfGroup")?.toString() || "",
    members: formData.get("members")?.toString() || "[]", // This will be preprocessed by the schema
  };

  const { success, data, error } = membersDataSchema.safeParse(formValues);

  if (!success) {
    // For error response, we need to parse members for proper typing
    let parsedMembers;
    try {
      parsedMembers = JSON.parse(formValues.members);
    } catch {
      parsedMembers = [];
    }

    return {
      success,
      errors: error.flatten().fieldErrors,
      values: {
        natureOfGroup: formValues.natureOfGroup,
        members: parsedMembers,
      },
    };
  }

  if (!redirectTo) {
    throw new Error("No redirect URL provided");
  }

  if (!id) {
    throw new Error("No application ID provided");
  }

  /* Submit validated data */
  await updateApplicationMembersData(id, {
    natureOfTheGroup: data.natureOfGroup,
    members: data.members,
  });

  redirect(redirectTo);
};
