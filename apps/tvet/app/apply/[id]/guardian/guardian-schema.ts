import { z } from "zod";

import {
  idTypeSChema,
  validateApplicantIdType,
} from "@/app/apply/[id]/id-type-schema";

export const guardianRole = z.enum([
  "parent",
  "grandparent",
  "relative",
  "other",
]);
export type GuardianRole = z.infer<typeof guardianRole>;

const phone = z.object({
  callingCode: z.string().nonempty(),
  phone: z.string().nonempty(),
});

export const guardianSchema = idTypeSChema
  .extend({
    guardian_first_name: z.string().trim().min(1),
    guardian_middle_name: z.string().trim().optional(),
    guardian_surname: z.string().trim().min(1),
    guardian_role: guardianRole,
    phones: z.array(phone),
    guardian_email: z.union([z.literal(""), z.string().email()]),
  })
  .superRefine((data, ctx) => {
    validateApplicantIdType(data, ctx);
  });

export type GuardianSchema = z.infer<typeof guardianSchema>;

export const guardianRoles = [
  { label: "Parent", value: "parent" },
  { label: "Grandparent", value: "grandparent" },
  { label: "Relative", value: "relative" },
  { label: "Other", value: "other" },
];
