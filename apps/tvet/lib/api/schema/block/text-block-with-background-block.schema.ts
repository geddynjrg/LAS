import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";
import { LinkSchema } from "@/lib/api/schema/link.schema";

export const TextBlockWithBackgroundBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_block_with_background"),

  title: z.string(),
  link: z.array(LinkSchema).optional(),
  block_text: z.union([z.array(DescriptionSchema), DescriptionSchema]),
  button_type: z.string().optional(),
});

export type TextBlockWithBackgroundBlockType = z.infer<
  typeof TextBlockWithBackgroundBlockSchema
>;
