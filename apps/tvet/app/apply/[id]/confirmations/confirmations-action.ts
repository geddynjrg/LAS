"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  confirmationsSchema,
  type ConfirmationsSchema,
} from "@/app/apply/[id]/confirmations/confirmations-schema";
import { updateApplication } from "@/lib/api/application";

export const confirmationsAction: FormAction<ConfirmationsSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();
  const values = getFormZodDataValues(formData, confirmationsSchema);

  if (!id) {
    return {
      success: false,
      errors: {},
      message: "ID is required",
      values,
    };
  }

  const { error, data, success } = confirmationsSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  console.log("confirmationsAction", data);

  const res = await updateApplication(id, {
    ...data,
    step_type: "confirmation",
  });

  console.log("update res", res);

  if (res.error) {
    console.warn("updateApplication confirmations step error", res.error);

    return {
      success: false,
      errors: {},
      message: res.error.message ?? "Something went wrong",
      values,
    };
  }

  redirect(`/apply/${id}/payment`);
};
