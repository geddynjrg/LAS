import { z } from "zod";

import { checkbox } from "@workspace/ui/lib/zod";

export const SexTypeEnum = z.enum(["M", "F", "I"]);
export const NatureOfBirthEnum = z.enum(["LiveBirth", "StillBirth"]);

export type ChildSchema = z.infer<typeof childSchema>;

export const childSchema = z
  .object({
    abandoned: checkbox(),
    id: z.string().nonempty(),
    firstName: z.string().trim().nonempty(),
    middleName: z.string().trim().optional(),
    natureOfBirth: NatureOfBirthEnum,
    dob: z.string().nonempty(),
    sex: SexTypeEnum,
    birthHappenedAtHome: z.string().nonempty(),
    weightOnBirth: z.string().trim().nonempty(),
    healthInstitution: z.string().trim().optional(),
    healthInstitutionCounty: z.string().trim().optional(),
    birthCounty: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    birthSubCounty: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    birthSublocation: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
    birthSublocationDistrict: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val ?? undefined),
  })
  .superRefine((data, ctx) => {
    if (data.birthHappenedAtHome === "No") {
      if (!data.healthInstitution) {
        ctx.addIssue({
          code: "custom",
          message: "Health institution is required.",
          path: ["healthInstitution"],
        });
      }
      if (!data.healthInstitutionCounty) {
        ctx.addIssue({
          code: "custom",
          message: "Health institution county is required.",
          path: ["healthInstitutionCounty"],
        });
      }
    }
  });
