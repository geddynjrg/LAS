"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  resetSchema,
  type Reset,
} from "@/app/(auth)/reset/[...path]/reset-schema";
import { passwordReset } from "@/lib/api/password-reset";

export const resetAction: FormAction<Reset> = async (_prev, formData) => {
  const values = getFormZodDataValues(formData, resetSchema);

  const { data, success, error } = resetSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const res = await passwordReset(data);

    return { success, message: res.data.message };
  } catch (error) {
    return {
      success: false,
      errors: {},
      message: error instanceof Error ? error.message : "Unknown error",
      values,
    };
  }
};
