"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import { updatePersonById } from "@/actions/update-person-data";
import {
  fatherSchema,
  type FatherSchema,
} from "@/app/edit/[personId]/father/father-schema";

export const fatherAction: FormAction<FatherSchema> = async (
  _prev,
  formData,
) => {
  const values = getFormZodDataValues(formData, fatherSchema);

  const { error, data, success } = fatherSchema.safeParse(values);

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
