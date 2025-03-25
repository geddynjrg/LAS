import { z } from "zod";

export const confirmationDataSchema = z.object({
  membersConfirm: z
    .union([z.literal("on"), z.null()])
    .refine((v) => !!v, "Please agree to the terms"),
  correctInformationConfirm: z
    .union([z.literal("on"), z.null()])
    .refine((v) => !!v, "Please agree to the terms"),
  liabilityConfirm: z
    .union([z.literal("on"), z.null()])
    .refine((v) => !!v, "Please agree to the terms"),
  fundsEligibleConfirm: z
    .union([z.literal("on"), z.null()])
    .refine((v) => !!v, "Please agree to the terms"),
});

export type ConfirmationData = z.infer<typeof confirmationDataSchema>;
