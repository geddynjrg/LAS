import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const TextBlockWithBackgroundBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_block_with_background"),

  title: z.string(),
  items: z.array(
    z.object({
      title: z.string().optional(),
      description: DescriptionSchema.optional(),
    }),
  ),
});

export type TextBlockWithBackgroundBlockType = z.infer<
  typeof TextBlockWithBackgroundBlockSchema
>;
