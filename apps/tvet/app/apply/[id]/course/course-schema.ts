import { z } from "zod";

import { validFile } from "@workspace/ui/lib/zod";

export const MAX_FILE_SIZE = 1e6 * 30; // 30 MB
export const MAX_CERTIFICATE_FILES = 3; // Maximum number of other certificates

export const FILE_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
};

export const courseSchema = z
  .object({
    institution: z.string().trim().nonempty(),
    course: z.string().trim().nonempty(),
    preferred_intake_period: z.string().trim().nonempty(),
    mandatoryQualifications: z.preprocess(stringToArray, z.array(z.string())),
    academic_qualifications_confirmed: z.preprocess(
      stringToArray,
      z.array(z.string()),
    ),
    highest_education_certificate: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
    other_certificates: z.preprocess(
      flatmap,
      z
        .array(validFile(FILE_ACCEPT, MAX_FILE_SIZE))
        .min(1)
        .max(MAX_CERTIFICATE_FILES),
    ),
  })
  .superRefine((data, ctx) => {
    // Ensure mandatory qualifications are checked
    if (
      data.academic_qualifications_confirmed.length !==
      data.mandatoryQualifications.length
    ) {
      ctx.addIssue({
        path: ["academic_qualifications_confirmed"],
        code: z.ZodIssueCode.custom,
        message: "ApplyForm.confirmQualificationsError",
      });
    }
  });

export type CourseSchema = z.infer<typeof courseSchema>;

function stringToArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v;
  }
  if (typeof v === "string") {
    return v.split(",").filter(Boolean);
  }
  return [];
}

function flatmap(v: unknown): unknown[] {
  if (v === null || v === undefined) {
    return [];
  }

  if (Array.isArray(v)) {
    return v.flatMap((item) => flatmap(item));
  }

  return [v];
}
