"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  groupMembersConfirmationDataSchema,
  type GroupMembersConfirmationData,
} from "@/app/apply/[id]/confirmations/group-members-confirmation-schema";
import { updateMemberConfirmationStatuses } from "@/lib/data/application-db";

export const groupMembersConfirmationDataAction: FormAction<GroupMembersConfirmationData> = async (
  _prev,
  formData
) => {
    let id: string;
    let selectedMembers: string[];
    const redirectUrl = formData.get("redirectTo")?.toString();
    
    try {
    // Get form values and validate with schema (schema handles JSON parsing)
    const values = getFormZodDataValues(formData, groupMembersConfirmationDataSchema);
    const { success, data, error } = groupMembersConfirmationDataSchema.safeParse(values);

    if (!success) {
      return {
        success,
        errors: error.flatten().fieldErrors,
        values,
      };
    }

    ({ id, selectedMembers } = data);

    if (!id) {
      return {
        success: false,
        message: "No application ID provided",
        errors: {
          id: ["Application ID is required"],
        },
        values,
      };
    }

  } catch (error) {
    console.error("Error updating member confirmation statuses:", error);
    
    return {
      success: false,
      message: "Failed to update member confirmation statuses",
      errors: {},
      values: getFormZodDataValues(formData, groupMembersConfirmationDataSchema),
    };
  }
     
  // Update member confirmation statuses in the database
  await updateMemberConfirmationStatuses(id, selectedMembers);
  
  const finalRedirectUrl = redirectUrl || `/apply/${id}/review`;
  redirect(finalRedirectUrl);
};
