import { z } from 'zod';

export const resetSchema = z.object({
  email: z.string().nonempty().email(),
});

export type Reset = z.infer<typeof resetSchema>;
