import { z } from "zod";

export const SexTypeSchema = z.enum(["M", "F", "I"]);

export const fatherSchema = z
  .object({
    id: z.string().nonempty(),
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    nationalId: z.string().optional(),
    citizenship: z.string().optional(),
    documentType: z.string().optional(),
    passportNumber: z.string().optional(),
    isPredefinedId: z.string().optional(),
    contacts: z
      .array(
        z.object({
          phoneCode: z.string().nonempty(),
          phone: z.string().optional(),
          email: z.string().optional(),
        }),
      )
      .min(1),
    education: z.string().optional(),
    dob: z.string().optional(),
    nationality: z.string().nonempty(),
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

    if (!data.nationalId) {
      data.contacts.forEach((contact, index) => {
        if (!contact.phone) {
          ctx.addIssue({
            code: "custom",
            message: "Phone is required",
            path: ["contacts", index, "phone"],
          });
        }
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

export type FatherSchema = z.infer<typeof fatherSchema>;
