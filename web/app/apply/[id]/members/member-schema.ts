import { FILE_ACCEPT, MAX_FILE_SIZE } from '@/lib/constants';
import { phoneNumber, validFile } from '@workspace/ui/lib/zod';
import { z } from 'zod';

// TODO: This can be removed if form will allow subfields in future, then just use membersSchema

// In your member schema file
export const memberSchema = z.object({
  fullname: z.string().nonempty(),
  nationalIdCode: z.string().nonempty(),
  gender: z.union([z.literal('Male'), z.literal('Female')]),
  type: z.string().min(1, 'Position is required'),
  economicActivity: z.string().optional(),
  phoneNumber: phoneNumber(),
  photoOfId: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
  disability: z.union([z.literal('on'), z.null()]),
  certificateOfDisability: validFile(FILE_ACCEPT, MAX_FILE_SIZE).optional(),
  pwdNumber: z.string().optional(),
  // Add confirmation fields as optional
  confirmation_status: z
    .union([
      z.literal('confirmed'),
      z.literal('declined'),
      z.literal('pending'),
      z.literal('sent'),
      z.literal('failed'),
    ])
    .optional(),
  confirmation_confirmed_at: z.number().optional(),
  confirmation_sent_at: z.number().optional(),
  confirmation_token: z.string().optional(),
  confirmation_token_expires_at: z.number().optional(),
});

export type Member = z.infer<typeof memberSchema>;
