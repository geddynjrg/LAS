import { z } from "zod";

import { validFile } from "@workspace/ui/lib/zod";

export const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export const FILE_ACCEPT = {
  "image/*": [".jpg", ".jpeg", ".png"],
  "application/pdf": [".pdf"],
};

export const courseSchema = z.object({
  institution: z.string().trim().nonempty(),
  course: z.string().trim().nonempty(),
  preferred_intake_period: z.string().trim().nonempty(),
  highest_education_certificate: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
  other_certificate: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
});

export type CourseSchema = z.infer<typeof courseSchema>;

export const dummyIntakePeriods = [
  { label: "January 2025", value: "intake-1" },
  { label: "July 2025", value: "intake-2" },
];
