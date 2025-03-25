import { z } from "zod";

import { MAX_FILE_SIZE } from "@/lib/constants";

export const groupDataSchema = z
  .object({
    groupName: z.string().nonempty(),
    groupRegistrationNumber: z.string().nonempty(),
    dateFormed: z.coerce.date(),
    groupRegistrationCertificate: z
      .instanceof(File)
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        "File exceed max file size",
      ),
    listOfMembersOnCertificate: z
      .instanceof(File)
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        "File exceed max file size",
      ),

    groupPurpose: z.preprocess(
      (v) =>
        Array.isArray(v)
          ? v
          : typeof v === "string"
            ? v.split(",").filter(Boolean)
            : [],
      z.array(z.string()).min(1),
    ),

    groupActivities: z.preprocess(
      (v) =>
        Array.isArray(v)
          ? v
          : typeof v === "string"
            ? v.split(",").filter(Boolean)
            : [],
      z.array(z.string()).min(1),
    ),
    valueChain: z
      .preprocess(
        (v) =>
          Array.isArray(v)
            ? v
            : typeof v === "string"
              ? v.split(",").filter(Boolean)
              : [],
        z.array(z.string()),
      )
      .optional(),

    tableBankingExperience: z
      .string()
      .regex(/^\d+$/, "Must be a number")
      .transform((val) => Number(val))
      .nullable()
      .optional(),
    tableBankingShareContribution: z
      .string()
      .regex(/^\d+$/, "Must be a number")
      .transform((val) => Number(val))
      .nullable()
      .optional(),
    tableBankingTotalLoanedOut: z
      .string()
      .regex(/^\d+$/, "Must be a number")
      .nullable()
      .transform((val) => Number(val))

      .optional(),
    tableBankingTotalRevolvingFund: z
      .string()
      .regex(/^\d+$/, "Must be a number")
      .transform((val) => Number(val))
      .nullable()
      .optional(),

    other: z.string().nullable().optional(),

    groupCreditHistory: z
      .instanceof(File)
      .refine(
        (file) => file.size <= MAX_FILE_SIZE,
        "File exceed max file size",
      ),
    countyOfOperation: z.string().nonempty(),
    constituency: z.string().nonempty(),
    ward: z.string().nonempty(),
    meetingPoint: z.string(),
    nearestLandmark: z.string(),
  })
  .superRefine((data, ctx) => {
    // if group activities include value chain, value chain should not be empty
    if (
      data.groupActivities.includes("Value chain") &&
      data.valueChain?.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        path: ["valueChain"],
      });
    }

    // table banking values required if table banking option is selected
    if (data.groupActivities.includes("Table banking")) {
      if (!data.tableBankingExperience) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          path: ["tableBankingExperience"],
        });
      }
      if (!data.tableBankingShareContribution) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          path: ["tableBankingShareContribution"],
        });
      }
      if (!data.tableBankingTotalLoanedOut) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          path: ["tableBankingTotalLoanedOut"],
        });
      }
      if (!data.tableBankingTotalRevolvingFund) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: "string",
          inclusive: true,
          path: ["tableBankingTotalRevolvingFund"],
        });
      }
    }
    // Other field is required if other is selected
    if (data.groupActivities.includes("Other") && !data.other) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: "string",
        inclusive: true,
        path: ["other"],
      });
    }
  });

export type GroupData = z.infer<typeof groupDataSchema>;
