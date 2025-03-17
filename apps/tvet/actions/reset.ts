"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import { resetSchema, type Reset } from "@/actions/reset-schema";

export const reset: FormAction<Reset> = async (_prev, formData) => {
  const values = getFormDataValues(formData, resetSchema);

  // dummy wait
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { success, data, error } = resetSchema.safeParse(values);

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
