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
    passportNumber: z.string().optional(),
    contacts: z
      .array(
        z.object({
          phoneCode: z.string().nonempty(),
          phone: z.string().nonempty(),
          email: z.string().optional(),
        }),
      )
      .min(1),
    education: z.string().optional(),
    dob: z.string().optional(),
    nationality: z.string().nonempty(),
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

export type FatherSchema = z.infer<typeof fatherSchema>;
