import { z } from "zod";

export const SexTypeEnum = z.enum(["M", "F", "I"]);
export const NatureOfBirthEnum = z.enum(["LiveBirth", "StillBirth"]);

export type ChildSchema = z.infer<typeof childSchema>;

export const childSchema = z.object({
  id: z.string().nonempty(),
  firstName: z.string().nonempty(),
  middleName: z.string().optional(),
  natureOfBirth: NatureOfBirthEnum,
  dob: z.string().nonempty(),
  sex: SexTypeEnum,
  weightOnBirth: z.string().nonempty(),
  healthInstitution: z.string().nonempty(),
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
});
