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
  dob: z.string().nonempty(),
  sex: SexTypeEnum,
  citizenship: z.string().nonempty(),
  nationality: z.string().nonempty(),
  maritalStatus: z.string().nonempty(),
  education: z.string().nonempty(),
  contacts: z
    .array(
      z.object({
        phoneCode: z.string().nonempty(),
        phone: z.string().nonempty(),
        email: z.string().optional(),
      }),
    )
    .min(1),
});
