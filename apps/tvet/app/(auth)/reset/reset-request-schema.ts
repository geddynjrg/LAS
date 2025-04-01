import { z } from "zod";

export const resetRequestSchema = z.object({
  email: z.string().trim().email(),
});

export type ResetRequest = z.infer<typeof resetRequestSchema>;
