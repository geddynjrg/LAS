import { z } from "zod";

import { validFile } from "@workspace/ui/lib/zod";

import { FILE_ACCEPT, MAX_FILE_SIZE } from "@/lib/constants";

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
  age: z.string().optional(),
  dob: z.string().nonempty(),
  sex: SexTypeEnum,
  citizenship: z.string().nonempty(),
  nationality: z.string().nonempty(),
  documentType: z.string().optional(),
  education: z.string().optional(),
  affidavitFile: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
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
