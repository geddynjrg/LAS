"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  resetRequestSchema,
  type ResetRequest,
} from "@/app/(auth)/reset/reset-request-schema";
import { passwordResetRequest } from "@/lib/api/password-reset-request";

export const resetRequestAction: FormAction<ResetRequest> = async (
  _prev,
  formData,
) => {
  const values = getFormZodDataValues(formData, resetRequestSchema);

  const { data, success, error } = resetRequestSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const res = await passwordResetRequest(data);

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
