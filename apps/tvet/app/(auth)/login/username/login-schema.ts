import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().nonempty(),
  password: z.string().nonempty(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
