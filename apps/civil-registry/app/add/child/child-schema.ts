import { z } from "zod";

import { checkbox } from "@workspace/ui/lib/zod";

export const SexTypeSchema = z.enum(["M", "F", "I"]);

export type ChildSchema = z.infer<typeof childSchema>;

export const childSchema = z
  .object({
    abandoned: checkbox(),
    id: z.string().nonempty(),
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    natureOfBirth: z.string().nonempty(),
    dob: z.string().nonempty(),
    sex: SexTypeSchema,
    weightOnBirth: z.string().refine(
      (val) => {
        const normalized = val.replace(",", ".");

        const num = parseFloat(normalized);
        return !isNaN(num) && num <= 10;
      },
      { message: "Weight must be a number less than or equal to 10" },
    ),
    birthHappenedAtHome: z.string().nonempty(),
    healthInstitutionCounty: z.string().optional(),
    healthInstitution: z.string().optional(),
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

export const multiChildSchema = z.object({
  children: z.array(childSchema).min(1),
});

export type MultiChildSchema = z.infer<typeof multiChildSchema>;
