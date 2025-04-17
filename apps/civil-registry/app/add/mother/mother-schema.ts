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
    dob: z.string().optional(),
    nationality: z.string().nonempty(),
    maritalStatus: z.string().nonempty(),
    isPredefinedId: z.string().optional(),
    contacts: z
      .array(
        z.object({
          phoneCode: z.string().nonempty(),
          phone: z.string().nonempty(),
          email: z.string().optional(),
        }),
      )
      .min(1),
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
    const requiresNationalId = data.isPredefinedId === "true";

    if (requiresNationalId && !data.nationalId) {
      ctx.addIssue({
        code: "custom",
        message: "National ID is required.",
        path: ["nationalId"],
      });
    }

    if (!requiresNationalId) {
      if (!data.firstName) {
        ctx.addIssue({
          code: "custom",
          message: "FormErrorMessages.firstNameRequired",
          path: ["firstName"],
        });
      }
      if (!data.lastName) {
        ctx.addIssue({
          code: "custom",
          message: "FormErrorMessages.lastNameRequired",
          path: ["lastName"],
        });
      }
      if (!data.passportNumber) {
        ctx.addIssue({
          code: "custom",
          message: "FormErrorMessages.passportNumberRequired",
          path: ["passportNumber"],
        });
      }
    }
  });

export type MotherSchema = z.infer<typeof motherSchema>;
