import { z } from "zod";

export const DescriptionSchema = z.object({
  value: z.string(),
  format: z.string(),
  processed: z.string(),
});

export type DescriptionType = z.infer<typeof DescriptionSchema>;
