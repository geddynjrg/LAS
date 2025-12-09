import { z } from 'zod';

export const memberConfirmationSchema = z.object({
  id: z.string(),
  redirectTo: z.string(),
});

export type MemberConfirmationData = z.infer<typeof memberConfirmationSchema>;