"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import {
  confirmationDataSchema,
  type ConfirmationData,
} from "@/app/apply/[id]/confirmations/confirmation-data-schema";
import { updateApplicationDeclarationsData } from "@/lib/data/application";

export const confirmationDataAction: FormAction<ConfirmationData> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, confirmationDataSchema);
  const id = formData.get("id")?.toString();

  const { success, data, error } = confirmationDataSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  if (!id) {
    throw new Error("No application ID provided");
  }

  /* Submit data to dummy data list */
  await updateApplicationDeclarationsData(id, data);

  return {
    success: true,
  };
};
