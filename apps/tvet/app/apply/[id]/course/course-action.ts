"use server";

import { redirect } from "next/navigation";

import type { FormAction } from "@workspace/ui/hooks/use-form";
import { getFormZodDataValues } from "@workspace/ui/lib/utils";

import {
  courseSchema,
  type CourseSchema,
} from "@/app/apply/[id]/course/course-schema";

export const courseAction: FormAction<CourseSchema> = async (
  _prev,
  formData,
) => {
  const id = formData.get("id")?.toString();
  const values = getFormZodDataValues(formData, courseSchema);

  const { error, data, success } = courseSchema.safeParse(values);

  if (!success) {
    return {
      success,
      errors: error.flatten().fieldErrors,
      values,
    };
  }

  console.log("courseAction", data);

  // await saveFile(data.highestQualificationCertificate, "test");
  redirect(`/apply/${id}/confirmations`);
};

// async function saveFile(file: File, documentHash: string) {
//   const data = await file.arrayBuffer();
//   await fs.appendFile(`./public/${documentHash}.jpg`, Buffer.from(data));
//   return;
// }
