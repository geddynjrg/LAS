import { z } from "zod";

export const resetSchema = z
  .object({
    uid: z.string().trim().nonempty(),
    timeStamp: z.string().trim().nonempty(),
    hash: z.string().trim().nonempty(),
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

export type Reset = z.infer<typeof resetSchema>;
