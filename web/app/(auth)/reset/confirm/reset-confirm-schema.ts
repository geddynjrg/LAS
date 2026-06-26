import { z } from 'zod';

export const resetConfirmSchema = z
  .object({
    uid: z.string().nonempty(),
    timestamp: z.string().nonempty(),
    hash: z.string().nonempty(),
    password: z.string().min(8),
    passwordConfirm: z.string().nonempty(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

export type ResetConfirm = z.infer<typeof resetConfirmSchema>;
