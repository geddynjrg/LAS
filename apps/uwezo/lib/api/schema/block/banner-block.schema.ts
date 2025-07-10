import { z } from "zod";

import { LinkButtonSchema } from "@/lib/api/schema/link-button.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const BannerBlockSchema = z.object({
  block_type: z.literal("banner"),
  title: z.string(),
  text: DescriptionSchema.optional(),
  help_text: DescriptionSchema.optional(),
  button: z.array(LinkButtonSchema).optional(),
});

export type BannerBlock = z.infer<typeof BannerBlockSchema>;
