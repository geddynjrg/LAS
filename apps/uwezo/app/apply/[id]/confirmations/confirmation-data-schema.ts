import { z } from "zod";

export const confirmationDataSchema = z.object({
  membersConfirm: z.preprocess(
    (val) => val ?? null,
    z
      .union([z.literal("on"), z.null()])
      .refine((v) => v === "on", { message: "Please agree to the terms" }),
  ),
  correctInformationConfirm: z.preprocess(
    (val) => val ?? null,
    z
      .union([z.literal("on"), z.null()])
      .refine((v) => v === "on", { message: "Please agree to the terms" }),
  ),
  liabilityConfirm: z.preprocess(
    (val) => val ?? null,
    z
      .union([z.literal("on"), z.null()])
      .refine((v) => v === "on", { message: "Please agree to the terms" }),
  ),
  fundsEligibleConfirm: z.preprocess(
    (val) => val ?? null,
    z
      .union([z.literal("on"), z.null()])
      .refine((v) => v === "on", { message: "Please agree to the terms" }),
  ),
});

export type ConfirmationData = z.infer<typeof confirmationDataSchema>;
