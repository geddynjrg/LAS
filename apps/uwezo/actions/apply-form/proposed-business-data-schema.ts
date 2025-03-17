import { z } from "zod";

export const proposedBusinessDataSchema = z.object({
  natureOfBusiness: z.string().nonempty(),
  businessType: z.preprocess(
    (v) =>
      Array.isArray(v)
        ? v
        : typeof v === "string"
          ? v.split(",").filter(Boolean)
          : [],
    z.array(z.string()).min(1),
  ),
  yearsInBusiness: z
    .string()
    .nonempty()
    .regex(/^\d+$/, "Must be a number")
    .transform((val) => Number(val)),

  averageIncome: z
    .string()
    .nonempty()
    .regex(/^\d+$/, "Must be a number")
    .transform((val) => Number(val)),

  costOfGoods: z
    .string()
    .nonempty()
    .regex(/^\d+$/, "Must be a number")
    .transform((val) => Number(val)),

  rentForBusiness: z
    .string()
    .nonempty()
    .regex(/^\d+$/, "Must be a number")
    .transform((val) => Number(val)),

  salaries: z
    .string()
    .nonempty()
    .regex(/^\d+$/, "Must be a number")
    .transform((val) => Number(val)),

  transportForBusinessStock: z
    .string()
    .nonempty()
    .regex(/^\d+$/, "Must be a number")
    .transform((val) => Number(val)),
});

export type ProposedBusinessData = z.infer<typeof proposedBusinessDataSchema>;
