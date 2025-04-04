import { z } from "zod";

export const SexTypeEnum = z.enum(["M", "F", "I"]);
export const NatureOfBirthEnum = z.enum(["LiveBirth", "StillBirth"]);

export type ChildSchema = z.infer<typeof childSchema>;

export const childSchema = z.object({
  id: z.string().nonempty(),
  firstName: z.string().trim().nonempty(),
  middleName: z.string().trim().optional(),
  natureOfBirth: NatureOfBirthEnum,
  dob: z.string().nonempty(),
  sex: SexTypeEnum,
  weightOnBirth: z.string().trim().nonempty(),
  healthInstitution: z.string().trim().nonempty(),
  birthSublocation: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  birthSublocationDistrict: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
});
