import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().nonempty().email(),
  password: z.string().nonempty(),
  passwordConfirm: z.string().nonempty(),
});

export type Signup = z.infer<typeof signupSchema>;
