"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import {
  getFormZodDataValues,
  prepareFileForUpload,
} from "@workspace/ui/lib/utils";

import {
  courseSchema,
  type CourseSchema,
} from "@/app/apply/[id]/course/course-schema";
import { updateApplication } from "@/lib/api/application";

export const courseAction: FormAction<CourseSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();
  const values = getFormZodDataValues(formData, courseSchema);

  if (!id) {
    return {
      success: false,
      errors: {},
      message: "ID is required",
      values,
    };
  }

  const { error, data, success } = courseSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  const res = await updateApplication(id, {
    ...data,
    step_type: "course",
    highest_education_certificate: await prepareFileForUpload(
      data.highest_education_certificate,
    ),
    // @ts-ignore TODO: wait for the API to support multiple files
    other_certificate: await Promise.all(
      data.other_certificate.map(prepareFileForUpload),
    ),
  });

  console.log("update res", res);

  if (res.error) {
    console.warn("updateApplication course step error", res.error);

    return {
      success: false,
      errors: {},
      message: res.error.message ?? "Something went wrong",
      values,
    };
  }

  redirect(`/apply/${id}/confirmation`);
};
