import { z } from "zod";

export const loanConditionsDataSchema = z.object({
  purposeOfLoan: z.preprocess(
    (v) =>
      Array.isArray(v)
        ? v
        : typeof v === "string"
          ? v.split(",").filter(Boolean)
          : [],
    z.array(z.string()).min(1),
  ),
  loanType: z.string().nonempty(),
  loanAmount: z
    .string()
    .nonempty()
    .transform((value) => value.replace(/[\s,]+/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d+(\.\d+)?$/, "Must be a valid number") // Ensures only numbers
        .transform((val) => Number(val)) // Convert string to number
        .refine((num) => num <= 100000, {
          message: "Value must not exceed 100000",
        }),
    ),
  repaymentPeriod: z.coerce.number().min(1).max(12),
  bankName: z.string().nonempty(),
  bankBranch: z.string().nonempty(),
  accountNumber: z.string().nonempty(),
});

export type LoanConditionsData = z.infer<typeof loanConditionsDataSchema>;
