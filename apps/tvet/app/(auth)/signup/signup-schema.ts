import { z } from "zod";

export const signupSchema = z
  .object({
    username: z.string().trim().nonempty(),
    email: z.string().trim().nonempty().email(),
    password: z.string().nonempty(),
    passwordConfirm: z.string().nonempty(),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Form.errors.password_mismatch",
        path: ["passwordConfirm"],
      });
    }
  });

export type SignupSchema = z.infer<typeof signupSchema>;
