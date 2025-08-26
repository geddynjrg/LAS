import { z } from 'zod';

export const membersConfirmationDataSchema = z.object({
  members: z
    .array(
      z.object({
        fullname: z.string().optional(),
        nationalIdCode: z.string().optional(),
        gender: z
          .union([z.literal('Male'), z.literal('Female'), z.literal('Other')])
          .optional(),
        type: z
          .union([
            z.literal('Chairman'),
            z.literal('Secretary'),
            z.literal('Member'),
          ])
          .optional(),
        phoneNumber: z.string().optional(),
        photoOfId: z.string().optional(),
        disability: z
          .object({
            certificateOfDisability: z.string().optional(),
            pwdNumber: z.string().optional(),
          })
          .optional(),
        status: z
          .union([z.literal('confirmed'), z.literal('pending')])
          .optional(),
      }),
    )
    .optional(),
});

export type MembersConfirmationData = z.infer<
  typeof membersConfirmationDataSchema
>;
