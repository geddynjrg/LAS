"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormDataValues } from "@workspace/ui/lib/utils";

import {
  signupSchema,
  type SignupSchema,
} from "@/app/(auth)/signup/signup-schema";
import { register } from "@/lib/api/register";

export const signupAction: FormAction<SignupSchema> = async (
  _prev,
  formData,
) => {
  const values = getFormDataValues(formData, signupSchema);

  const { data, success, error } = signupSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    await register(data);
  } catch (error) {
    console.warn("Error during signup:", error);

    return {
      success: false,
      errors: {},
      message: error instanceof Error ? error.message : "Unknown error",
      values,
    };
  }

  return { success };
};
