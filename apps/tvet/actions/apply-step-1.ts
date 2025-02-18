"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import {
  applyStep1Schema,
  type ApplyStep1,
} from "@/actions/apply-step-1-schema";

export const applyStep1: FormAction<ApplyStep1> = async (_prev, formData) => {
  const values = getFormDataValues(formData, applyStep1Schema);

  // dummy wait
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { success, data, error } = applyStep1Schema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  console.log("submit success", data);
  // TODO: Send data to the server

  return { success };
};
