import { z } from "zod";

import { MAX_FILE_SIZE } from "@/lib/constants";

// TODO: This can be removed if form will allow subfields in future, then just use membersSchema

export const memberSchema = z.object({
  fullname: z.string().nonempty(),
  nationalIdCode: z.string().nonempty(),
  gender: z.union([z.literal("Male"), z.literal("Female"), z.literal("Other")]),
  type: z.union([
    z.literal("Chairman"),
    z.literal("Secretary"),
    z.literal("Member"),
  ]),
  phoneNumber: z.string().nonempty(),
  photoOfId: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File exceed max file size"),
  disability: z.union([z.literal("on"), z.null()]),
  certificateOfDisability: z.string().nonempty(),
  pwdNumber: z.string().optional(),
});

export type Member = z.infer<typeof memberSchema>;
