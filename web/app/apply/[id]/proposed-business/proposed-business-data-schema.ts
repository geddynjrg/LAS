import { z } from 'zod';

export const customExpenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z
    .string()
    .nonempty()
    .regex(/^\d+$/, 'Common.mustBeValidNumber')
    .transform((val) => Number(val)),
});

// Form-specific type where amount is still a string (before validation)
export type CustomExpenseForm = {
  name: string;
  amount: string;
};

// Schema for form validation (excludes customExpenses which we handle separately)
export const proposedBusinessFormSchema = z.object({
  natureOfBusiness: z.string().nonempty(),
  businessType: z.preprocess(
    (v) =>
      Array.isArray(v)
        ? v
        : typeof v === 'string'
          ? v.split(',').filter(Boolean)
          : [],
    z.array(z.string()).min(1),
  ),
  yearsInBusiness: z
    .string()
    .nonempty()
    .regex(/^\d+$/, 'Common.mustBeValidNumber')
    .transform((val) => Number(val)),

  averageIncome: z
    .string()
    .nonempty()
    .regex(/^\d+$/, 'Common.mustBeValidNumber')
    .transform((val) => Number(val)),

  costOfGoods: z
    .string()
    .nonempty()
    .regex(/^\d+$/, 'Common.mustBeValidNumber')
    .transform((val) => Number(val)),

  rentForBusiness: z
    .string()
    .nonempty()
    .regex(/^\d+$/, 'Common.mustBeValidNumber')
    .transform((val) => Number(val)),

  salaries: z
    .string()
    .nonempty()
    .regex(/^\d+$/, 'Common.mustBeValidNumber')
    .transform((val) => Number(val)),

  transportForBusinessStock: z
    .string()
    .nonempty()
    .regex(/^\d+$/, 'Common.mustBeValidNumber')
    .transform((val) => Number(val)),
});

// Full schema with customExpenses for final validation
export const proposedBusinessDataSchema = proposedBusinessFormSchema.extend({
  customExpenses: z.array(customExpenseSchema).optional().default([]),
});

export type ProposedBusinessData = z.infer<typeof proposedBusinessDataSchema>;
export type CustomExpense = z.infer<typeof customExpenseSchema>;
