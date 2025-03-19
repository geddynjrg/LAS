import { z } from "zod";

export const SexTypeSchema = z.enum(["M", "F", "I"]);

export const motherSchema = z
  .object({
    id: z.string().nonempty(),
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    nationalId: z.string().optional(),
    citizenship: z.string().optional(),
    passportNumber: z.string().optional(),
    fatherName: z.string().optional(),
    education: z.string().optional(),
    email: z.string().optional(),
    dob: z.string().optional(),
    nationality: z.string().nonempty(),
    maritalStatus: z.string().nonempty(),
    phoneCode: z.string().nonempty(),
    phone: z.string().nonempty(),
    residenceSublocation: z.string().nonempty(),
    residenceDistrict: z.string().nonempty(),
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
    const isNationalIdEmpty = !data.nationalId || data.nationalId.trim() === "";
    const isPassportEmpty =
      !data.passportNumber || data.passportNumber.trim() === "";

    if (isNationalIdEmpty && isPassportEmpty) {
      ctx.addIssue({
        code: "custom",
        message: "National ID is required.",
        path: ["nationalId"],
      });
    }
  });

export type MotherSchema = z.infer<typeof motherSchema>;
