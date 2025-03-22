"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  informantSchema,
  type InformantSchema,
} from "@/app/add/informant/informant-schema";
import { createNewPerson } from "@/lib/services/birth-registration-service";

export const informantAction: FormAction<InformantSchema> = async (
  _prev,
  formData,
) => {
  const values = getFormZodDataValues(formData, informantSchema);

  const { error, data, success } = informantSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }
  createNewPerson("informant", data);

  redirect(`/add/final-review`);
};
