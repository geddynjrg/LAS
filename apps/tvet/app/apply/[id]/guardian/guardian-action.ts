"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";

import type { GuardianSchema } from "@/app/apply/[id]/guardian/guardian-schema";

export const guardianAction: FormAction<GuardianSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();

  console.log("server action");

  redirect(`/apply/${id}/course`);
};
