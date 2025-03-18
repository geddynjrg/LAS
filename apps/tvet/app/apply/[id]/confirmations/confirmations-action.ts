"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";

import type { ConfirmationsSchema } from "@/app/apply/[id]/confirmations/confirmations-schema";

export const confirmationsAction: FormAction<ConfirmationsSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();

  console.log("server action");

  redirect(`/apply/${id}/payment`);
};
