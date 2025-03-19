import { z } from "zod";

export const SexTypeSchema = z.enum(["M", "F", "I"]);

export const childSchema = z.object({
  id: z.string().nonempty(),
  firstName: z.string().nonempty(),
  middleName: z.string().optional(),
  natureOfBirth: z.string().nonempty(),
  dob: z.string().nonempty(),
  sex: SexTypeSchema,
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

export type ChildSchema = z.infer<typeof childSchema>;
