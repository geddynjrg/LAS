"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  confirmationDataSchema,
  type ConfirmationData,
} from "@/app/apply/[id]/confirmations/confirmation-data-schema";
import { updateApplicationDeclarationsData } from "@/lib/data/application-db";

export const confirmationDataAction: FormAction<ConfirmationData> = async (
  _prev,
  formData,
) => {
  const values = getFormZodDataValues(formData, confirmationDataSchema);
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
