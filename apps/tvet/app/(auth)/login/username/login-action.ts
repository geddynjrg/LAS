"use server";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  loginSchema,
  type LoginSchema,
} from "@/app/(auth)/login/username/login-schema";
import { login } from "@/lib/api/login";
import { createSession } from "@/lib/session";

export const loginAction: FormAction<LoginSchema> = async (_prev, formData) => {
  const values = getFormZodDataValues(formData, loginSchema);

  const { data, success, error } = loginSchema.safeParse(values);

  if (error) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const res = await login(data);

    await createSession({
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    });
  } catch (error) {
    console.warn("Error during login:", error);

    return {
      success: false,
      errors: {},
      message: error instanceof Error ? error.message : "Unknown error",
      values,
    };
  }

  return { success };
};
