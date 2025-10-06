import { FILE_ACCEPT, MAX_FILE_SIZE } from '@/lib/constants';
import { phoneNumber, validFile } from '@workspace/ui/lib/zod';
import { z } from 'zod';

// Member schema for validation within members array - matching existing Member interface
// Essential fields are required for proper validation
const memberSchema = z.object({
  fullname: z.string().min(1, 'Member name is required'),
  nationalIdCode: z.string().min(1, 'National ID is required'),
  gender: z.union([z.literal('Male'), z.literal('Female'), z.literal('Other')]),
  type: z.union([
    z.literal('Chairman'),
    z.literal('Secretary'),
    z.literal('Member'),
  ]),
  phoneNumber: phoneNumber(),
  photoOfId: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
  disability: z
    .object({
      certificateOfDisability: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
      pwdNumber: z.string().optional(),
    })
    .optional(),
  status: z.union([z.literal('confirmed'), z.literal('pending')]).optional(),
  requiresConfirmation: z.boolean().optional(),
});

export const membersDataSchema = z.object({
  natureOfGroup: z.string().min(1, 'Nature of group is required'),
  members: z.preprocess(
    (val) => {
      // Parse JSON string to array
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val;
    },
    z.array(memberSchema).min(1, 'At least one member is required'),
  ),
});

export type MembersData = z.infer<typeof membersDataSchema>;
