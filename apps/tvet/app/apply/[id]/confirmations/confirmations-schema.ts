import { z } from "zod";

export const confirmationsSchema = z.object({
  confirmPersonalInformation: z.literal("on"),
  confirmEligibilityRequirements: z.literal("on"),
});

export type ConfirmationsSchema = z.infer<typeof confirmationsSchema>;
