import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const TextBlockWithGradientBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_block_with_gradient"),

  block_text: z.array(DescriptionSchema),
});

export type TextBlockWithGradientBlockType = z.infer<
  typeof TextBlockWithGradientBlockSchema
>;
