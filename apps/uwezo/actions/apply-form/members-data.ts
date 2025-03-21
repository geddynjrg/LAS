"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import { updateApplicationMembersData } from "@/actions/application";
import {
  membersDataSchema,
  type MembersData,
} from "@/actions/apply-form/members-data-schema";

export const membersData: FormAction<MembersData> = async (_prev, formData) => {
  const values = getFormDataValues(formData, membersDataSchema);
  const redirectTo = formData.get("redirectTo")?.toString();
  const id = formData.get("id")?.toString();
  let members;

  try {
    members = JSON.parse(formData.get("members")?.toString() || "[]");
  } catch (error) {
    // TODO: Validate members properly when form is capable of handling it
    console.error("Error parsing members data", error);
    members = [];
  }

  const { success, data, error } = membersDataSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  if (!redirectTo) {
    throw new Error("No redirect URL provided");
  }

  if (!id) {
    throw new Error("No application ID provided");
  }

  /* Submit data to dummy data list */
  await updateApplicationMembersData(id, {
    natureOfTheGroup: data.natureOfGroup,
    members,
  });

  redirect(redirectTo);
};
