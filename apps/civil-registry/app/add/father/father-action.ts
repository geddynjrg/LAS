"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import {
  fatherSchema,
  type FatherSchema,
} from "@/app/add/father/father-schema";
import { createNewPerson } from "@/lib/services/birth-registration-service";

export const fatherAction: FormAction<FatherSchema> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, fatherSchema);

  const { error, data, success } = fatherSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }
  createNewPerson("father", data);

  redirect(`/add/informant`);
};
