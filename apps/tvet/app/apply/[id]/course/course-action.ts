"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";

import type { CourseSchema } from "@/app/apply/[id]/course/course-schema";

export const courseAction: FormAction<CourseSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();

  console.log("server action");

  redirect(`/apply/${id}/confirmations`);
};
