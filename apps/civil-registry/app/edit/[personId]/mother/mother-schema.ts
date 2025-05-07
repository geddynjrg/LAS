import { z } from "zod";

export const SexTypeEnum = z.enum(["M", "F", "I"]);

export type MotherSchema = z.infer<typeof motherSchema>;

export const motherSchema = z.object({
  id: z.string().nonempty(),
  nationalId: z.string().optional(),
  firstName: z.string().nonempty(),
  middleName: z.string().optional(),
  fatherName: z.string().optional(),
  lastName: z.string().nonempty(),
  age: z.string().optional(),
  dob: z.string().nonempty(),
  sex: SexTypeEnum,
  citizenship: z.string().nonempty(),
  nationality: z.string().nonempty(),
  documentType: z.string().optional(),
  maritalStatus: z.string().nonempty(),
  education: z.string().optional(),
  residenceCounty: z.string().optional(),
  residenceSublocation: z.string().optional(),
  residenceDistrict: z.string().optional(),
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
  contacts: z
    .array(
      z.object({
        phoneCode: z.string().nonempty(),
        phone: z.string().optional(),
        email: z.string().optional(),
      }),
    )
    .min(1),
});
