import { z } from "zod";

export const informantSchema = z
  .object({
    id: z.string().nonempty(),
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    nationalId: z.string().optional(),
    citizenship: z.string().optional(),
    passportNumber: z.string().optional(),
    email: z.string().optional(),
    dob: z.string().optional(),
    informantType: z.string().nonempty(),
    nationality: z.string().nonempty(),
    capacityOfInformant: z.string().nonempty(),
    natureOfRelation: z.string().optional(),
    phoneCode: z.string().nonempty(),
    phone: z.string().nonempty(),
  })
  .superRefine((data, ctx) => {
    if (data.informantType === "Other") {
      const isNationalIdEmpty =
        !data.nationalId || data.nationalId.trim() === "";
      const isPassportEmpty =
        !data.passportNumber || data.passportNumber.trim() === "";

      if (isNationalIdEmpty && isPassportEmpty) {
        ctx.addIssue({
          code: "custom",
          message: "National ID is required.",
          path: ["nationalId"],
        });
      }
    }
  });

export type InformantSchema = z.infer<typeof informantSchema>;
