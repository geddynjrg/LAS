"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import { signupSchema, type Signup } from "@/app/(auth)/signup/signup-schema";

export const signupAction: FormAction<Signup> = async (_prev, formData) => {
  const values = getFormDataValues(formData, signupSchema);

  // dummy wait
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { success, data, error } = signupSchema.safeParse(values);

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
