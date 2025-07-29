import { z } from "zod";

export const confirmationDataSchema = z.object({
  membersConfirm: z.preprocess(
    (val) => val ?? null,
    z
      .union([z.literal("on"), z.null()])
      .refine((v) => v === "on", { message: "Common.pleaseAgreeToTheTerms" }),
  ),
  correctInformationConfirm: z.preprocess(
    (val) => val ?? null,
    z
      .union([z.literal("on"), z.null()])
      .refine((v) => v === "on", { message: "Common.pleaseAgreeToTheTerms" }),
  ),
  liabilityConfirm: z.preprocess(
    (val) => val ?? null,
    z
      .union([z.literal("on"), z.null()])
      .refine((v) => v === "on", { message: "Common.pleaseAgreeToTheTerms" }),
  ),
  fundsEligibleConfirm: z.preprocess(
    (val) => val ?? null,
    z
      .union([z.literal("on"), z.null()])
      .refine((v) => v === "on", { message: "Common.pleaseAgreeToTheTerms" }),
  ),
});

export type ConfirmationData = z.infer<typeof confirmationDataSchema>;
