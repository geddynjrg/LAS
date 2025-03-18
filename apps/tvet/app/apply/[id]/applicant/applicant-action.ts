"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";

import type { ApplicantSchema } from "@/app/apply/[id]/applicant/applicant-schema";

export const applicantAction: FormAction<ApplicantSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();

  console.log("server action");

  redirect(`/apply/${id}/guardian`);
};
