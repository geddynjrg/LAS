import { loanTypeValues } from '@/lib/constants';
import { z } from 'zod';

export const loanConditionsDataSchema = z
  .object({
    purposeOfLoan: z.preprocess(
      (v) =>
        Array.isArray(v)
          ? v
          : typeof v === 'string'
            ? v.split(',').filter(Boolean)
            : [],
      z.array(z.string()).min(1),
    ),
    loanType: z.string().nonempty(),
    loanAmount: z
      .string()
      .nonempty()
      .transform((value) => value.replace(/[\s,]+/g, ''))
      .pipe(
        z
          .string()
          .regex(/^-?\d+(\.\d+)?$/, 'Common.mustBeValidNumber') // ensures only numbers
          .transform((val) => Number(val))
          .refine(
            (val) => val > 0,
            'ApplicationDetailsPage.loan.invalidLoanAmount',
          ),
      ),
    repaymentPeriod: z.coerce.number().min(1).max(12),
    bankName: z.string().nonempty(),
    bankNameOther: z.string().min(3).optional(),
    bankBranch: z.string().nonempty(),
    accountNumber: z.string().nonempty(),
  })
  .superRefine((data, ctx) => {
    const loanType = data.loanType;

    switch (loanType) {
      case loanTypeValues.Endeleza.title:
        if (data.loanAmount > loanTypeValues.Endeleza.maxLoanAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['loanAmount'],
            message: 'ApplicationDetailsPage.loan.maximumLoan',
            params: { count: loanTypeValues.Endeleza.maxLoanAmount },
          });
        }

        break;
      case loanTypeValues.Wezesha.title:
        if (data.loanAmount > loanTypeValues.Wezesha.maxLoanAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['loanAmount'],
            message: 'ApplicationDetailsPage.loan.maximumLoan',
            params: { count: loanTypeValues.Wezesha.maxLoanAmount },
          });
        }
        break;
      default:
        return;
    }
  });

export type LoanConditionsData = z.infer<typeof loanConditionsDataSchema>;
