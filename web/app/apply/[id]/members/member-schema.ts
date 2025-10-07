import { FILE_ACCEPT, MAX_FILE_SIZE } from '@/lib/constants';
import { phoneNumber, validFile } from '@workspace/ui/lib/zod';
import { z } from 'zod';

// TODO: This can be removed if form will allow subfields in future, then just use membersSchema

export const memberSchema = z.object({
  fullname: z.string().nonempty(),
  nationalIdCode: z.string().nonempty(),
  gender: z.union([z.literal('Male'), z.literal('Female'), z.literal('Other')]),
  type: z.string().min(1, 'Position is required'),
  phoneNumber: phoneNumber(),
  photoOfId: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
  disability: z.union([z.literal('on'), z.null()]),
  certificateOfDisability: validFile(FILE_ACCEPT, MAX_FILE_SIZE).optional(),
  pwdNumber: z.string().optional(),
});

export type Member = z.infer<typeof memberSchema>;
