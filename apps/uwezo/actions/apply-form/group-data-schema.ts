import { z } from "zod";

import { MAX_FILE_SIZE } from "@/lib/constants";

export const groupDataSchema = z.object({
  groupName: z.string().nonempty(),
  groupRegistrationNumber: z.string().nonempty(),
  dateFormed: z.coerce.date(),
  groupRegistrationCertificate: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File exceed max file size"),
  listOfMembersOnCertificate: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File exceed max file size"),

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
      z.array(z.string()).min(1),
    )
    .optional(),
  tableBankingExperience: z.number(),
  tableBankingShareContribution: z.number(),
  tableBankingTotalLoanedOut: z.number(),
  tableBankingTotalRevolvingFund: z.number(),
  other: z.string(),

  groupCreditHistory: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File exceed max file size"),
  countyOfOperation: z.string().nonempty(),
  constituency: z.string().nonempty(),
  ward: z.string().nonempty(),
  meetingPoint: z.string(),
  nearestLandmark: z.string(),
});

export type GroupData = z.infer<typeof groupDataSchema>;
