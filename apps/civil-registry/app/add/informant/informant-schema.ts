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
    dob: z.string().optional(),
    informantType: z.string().nonempty(),
    nationality: z.string().nonempty(),
    capacityOfInformant: z.string().nonempty(),
    capacityOfInformantOther: z.string().optional(),
    natureOfRelation: z.string().optional(),
    isPredefinedId: z.string().optional(),
    contacts: z
      .array(
        z.object({
          phoneCode: z.string().nonempty(),
          phone: z.string().optional(),
          email: z.string().optional(),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.informantType === "Other") {
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

      if (!data.contacts || data.contacts.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "At least one contact is required.",
          path: ["contacts.children.0.phone"],
        });
      }

      if (
        data.capacityOfInformant === "Other" &&
        !data.capacityOfInformantOther
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Capacity of informant is required.",
          path: ["capacityOfInformantOther"],
        });
      }
    }
  });

export type InformantSchema = z.infer<typeof informantSchema>;
