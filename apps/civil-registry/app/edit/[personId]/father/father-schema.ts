import { z } from "zod";

import { MAX_FILE_SIZE } from "@/lib/constants";

export const SexTypeEnum = z.enum(["M", "F", "I"]);

export type FatherSchema = z.infer<typeof fatherSchema>;

export const fatherSchema = z.object({
  id: z.string().nonempty(),
  nationalId: z.string().optional(),
  firstName: z.string().nonempty(),
  middleName: z.string().optional(),
  affidavit: z.string().optional(),
  lastName: z.string().nonempty(),
  passportNumber: z.string().optional(),
  dob: z.string().nonempty(),
  sex: SexTypeEnum,
  citizenship: z.string().nonempty(),
  nationality: z.string().nonempty(),
  education: z.string().nonempty(),
  affidavitFile: z
    .instanceof(File, { message: "File is required" })
    .refine((file) => file.size > 0, "File is required")
    .refine((file) => file.size <= MAX_FILE_SIZE, "File exceed max file size"),
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
