"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import { updatePersonById } from "@/actions/update-person-data";
import {
  motherSchema,
  type MotherSchema,
} from "@/app/edit/[personId]/mother/mother-schema";

export const motherAction: FormAction<MotherSchema> = async (
  _prev,
  formData,
) => {
  const values = getFormZodDataValues(formData, motherSchema);

  const { error, data, success } = motherSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  await updatePersonById(data.id, data);

  return {
    success: true,
    values: data,
  };
};
