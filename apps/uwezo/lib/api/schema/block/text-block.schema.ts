import { z } from "zod";

import { LinkButtonSchema } from "@/lib/api/schema/link-button.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const TextBlockSchema = z.object({
  block_type: z.literal("text_block"),
  text: DescriptionSchema,
  button: z.array(LinkButtonSchema).optional(),
});

export type TextBlock = z.infer<typeof TextBlockSchema>;
