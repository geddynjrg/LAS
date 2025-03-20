import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { LinkSchema } from "@/lib/api/schema/link.schema";

export const TextBlockWithBackgroundBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_block_with_background"),

  title: z.string(),
  link: z.array(LinkSchema),
  button_type: z.string(),
});

export type TextBlockWithBackgroundBlockType = z.infer<
  typeof TextBlockWithBackgroundBlockSchema
>;
