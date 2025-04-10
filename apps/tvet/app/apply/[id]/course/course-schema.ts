import { z } from "zod";

import { validFile } from "@workspace/ui/lib/zod";

export const MAX_FILE_SIZE = 1e6 * 30; // 30 MB

export const FILE_ACCEPT = {
  "image/*": [".jpg", ".jpeg", ".png"],
  "application/pdf": [".pdf"],
};

export const courseSchema = z.object({
  institute: z.string().nonempty(),
  course: z.string().nonempty(),
  intakePeriod: z.string().nonempty(),
  highestQualificationCertificate: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
  otherCertificate: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
});

export type CourseSchema = z.infer<typeof courseSchema>;

export const dummyInstitutes = [
  {
    label: "Waithaka VTC",
    value: "institute-1",
    courses: [
      {
        label: "Electrical installation training",
        value: "course-1",
        intakePeriods: [
          { label: "January 2025", value: "intake-1" },
          { label: "July 2025", value: "intake-2" },
          { label: "January 2026", value: "intake-3" },
        ],
      },
      {
        label: "Cosmetology (Hairdressing and Beauty) Training",
        value: "course-2",
        intakePeriods: [
          { label: "February 2025", value: "intake-4" },
          { label: "July 2025", value: "intake-5" },
        ],
      },
    ],
  },
  {
    label: "Old Mathari VTC",
    value: "institute-2",
    courses: [
      {
        label: "Business Management",
        value: "course-3",
        intakePeriods: [
          { label: "January 2025", value: "intake-6" },
          { label: "July 2025", value: "intake-7" },
        ],
      },

      {
        label: "Computer Science",
        value: "course-4",
        intakePeriods: [{ label: "September 2025", value: "intake-8" }],
      },
    ],
  },
];
