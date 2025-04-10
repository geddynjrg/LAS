"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  applicantSchema,
  type ApplicantSchema,
} from "@/app/apply/[id]/applicant/applicant-schema";

export const applicantAction: FormAction<ApplicantSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();
  const values = getFormZodDataValues(formData, applicantSchema);

  const { error, data, success } = applicantSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  console.log("applicantAction", data);

  redirect(`/apply/${id}/guardian`);
};
