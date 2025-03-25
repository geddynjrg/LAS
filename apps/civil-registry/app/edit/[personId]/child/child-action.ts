"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import { updatePersonById } from "@/actions/update-person-data";
import {
  childSchema,
  type ChildSchema,
} from "@/app/edit/[personId]/child/child-schema";

export const childAction: FormAction<ChildSchema> = async (_prev, formData) => {
  const values = getFormZodDataValues(formData, childSchema);

  const { error, data, success } = childSchema.safeParse(values);

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
