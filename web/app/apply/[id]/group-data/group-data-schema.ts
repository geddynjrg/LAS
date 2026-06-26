import { FILE_ACCEPT, MAX_FILE_SIZE } from '@/lib/constants';
import { normalizeGroupActivitySelections } from '@/lib/constants/group-activities-taxonomy';
import { validFile } from '@workspace/ui/lib/zod';
import { z } from 'zod';

export const groupDataSchema = z
  .object({
    groupName: z.string().nonempty(),
    groupRegistrationNumber: z.string().nonempty(),
    dateFormed: z
      .string()
      .trim()
      .date()
      .refine((value) => {
        const selected = new Date(`${value}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected <= today;
      }, 'ApplicationDetailsPage.groupData.basicInfo.dateRegisteredFuture'),
    groupRegistrationCertificate: validFile(FILE_ACCEPT, MAX_FILE_SIZE),
    listOfMembersOnCertificate: validFile(FILE_ACCEPT, MAX_FILE_SIZE),

    groupMeetingMinutes: z.preprocess(
      (v) => (Array.isArray(v) ? v : v != null ? [v] : []),
      z.array(validFile(FILE_ACCEPT, MAX_FILE_SIZE)).min(1, {
        message: 'At least one meeting minute file is required',
      }),
    ),

    groupPurpose: z.preprocess(
      (v) =>
        Array.isArray(v)
          ? v
          : typeof v === 'string'
            ? v.split(',').filter(Boolean)
            : [],
      z.array(z.string()).min(1),
    ),

    groupActivities: z.preprocess((v) => {
      const values = Array.isArray(v)
        ? v
        : typeof v === 'string'
          ? v.split(',').filter(Boolean)
          : [];
      return normalizeGroupActivitySelections(values);
    }, z.array(z.string()).min(1)),
    valueChain: z
      .preprocess(
        (v) =>
          Array.isArray(v)
            ? v
            : typeof v === 'string'
              ? v.split(',').filter(Boolean)
              : [],
        z.array(z.string()),
      )
      .optional(),

    tableBankingExperience: z
      .string()
      .regex(/^\d+$/, 'Common.mustBeValidNumber')
      .transform((val) => Number(val))
      .nullable()
      .optional(),
    tableBankingShareContribution: z
      .string()
      .regex(/^\d+$/, 'Common.mustBeValidNumber')
      .transform((val) => Number(val))
      .nullable()
      .optional(),
    tableBankingTotalLoanedOut: z
      .string()
      .regex(/^\d+$/, 'Common.mustBeValidNumber')
      .nullable()
      .transform((val) => Number(val))

      .optional(),
    tableBankingTotalRevolvingFund: z
      .string()
      .regex(/^\d+$/, 'Common.mustBeValidNumber')
      .transform((val) => Number(val))
      .nullable()
      .optional(),

    other: z.string().nullable().optional(),

    groupCreditHistory: z
      .preprocess(
        (v) => (Array.isArray(v) ? v : v != null ? [v] : []),
        z.array(validFile(FILE_ACCEPT, MAX_FILE_SIZE)),
      )
      .optional(),
    countyOfOperation: z.string().nonempty(),
    constituency: z.string().nonempty(),
    ward: z.string().nonempty(),
    meetingPoint: z.string(),
    nearestLandmark: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.groupMeetingMinutes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['groupMeetingMinutes'],
        message: 'At least one meeting minute file is required',
      });
    }

    // if group activities include value chain, value chain should not be empty
    if (
      data.groupActivities.includes('Value chain') &&
      data.valueChain?.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['valueChain'],
      });
    }

    // table banking values required if table banking option is selected
    if (data.groupActivities.includes('Table banking')) {
      if (!data.tableBankingExperience) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: 'string',
          inclusive: true,
          path: ['tableBankingExperience'],
        });
      }
      if (!data.tableBankingShareContribution) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: 'string',
          inclusive: true,
          path: ['tableBankingShareContribution'],
        });
      }
      if (!data.tableBankingTotalLoanedOut) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: 'string',
          inclusive: true,
          path: ['tableBankingTotalLoanedOut'],
        });
      }
      if (!data.tableBankingTotalRevolvingFund) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: 'string',
          inclusive: true,
          path: ['tableBankingTotalRevolvingFund'],
        });
      }
    }
    // Other field is required if other is selected
    if (data.groupActivities.includes('Other') && !data.other) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: true,
        path: ['other'],
      });
    }
  });

export type GroupData = z.infer<typeof groupDataSchema>;
