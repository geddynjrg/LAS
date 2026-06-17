import { loanTypeValues } from '@/lib/constants';
import { z } from 'zod';

export const loanConditionsDataSchema = z
  .object({
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
    repaymentPeriod: z.coerce.number().min(1).max(24),
    // bankName: z.string().nonempty(),
    bankName: z.string().nonempty('Please enter the institution name'),
    // institutionType: z.enum(['bank', 'sacco'], {
    //   errorMap: () => ({ message: 'Please select either Bank or SACCO' }),
    // }),
    institutionType: z.string().nonempty('Please select either Bank or SACCO'),
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
        if (data.loanAmount < loanTypeValues.Wezesha.minLoanAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['loanAmount'],
            message: 'ApplicationDetailsPage.loan.minimumLoan',
            params: { count: loanTypeValues.Wezesha.minLoanAmount },
          });
        }

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
  })
  .superRefine((data, ctx) => {
    // Validate that institution type is selected if it's required
    if (!data.institutionType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['institutionType'],
        message: 'Please select either Bank or SACCO',
      });
    }
  });

export type LoanConditionsData = z.infer<typeof loanConditionsDataSchema>;
