"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import { loginSchema, type Login } from "@/actions/login-schema";

export const login: FormAction<Login> = async (_prev, formData) => {
  const values = getFormDataValues(formData, loginSchema);

  // dummy wait
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { success, data, error } = loginSchema.safeParse(values);

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
