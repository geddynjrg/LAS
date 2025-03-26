"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import {
  getFormDataValues,
  getFormZodDataValues,
} from "@workspace/ui/lib/utils";

import {
  guardianSchema,
  type GuardianSchema,
} from "@/app/apply/[id]/guardian/guardian-schema";

export const guardianAction: FormAction<GuardianSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();
  const values = getFormZodDataValues(formData, guardianSchema);

  const { error, data, success } = guardianSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values: getFormDataValues(formData, guardianSchema),
    };
  }

  console.log("guardianAction", data);

  redirect(`/apply/${id}/course`);
};
