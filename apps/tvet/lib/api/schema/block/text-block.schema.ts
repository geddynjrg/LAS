import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const TextBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_block"),
  title: z.string().optional(),
  description: DescriptionSchema.optional(),
});

export type TextBlockType = z.infer<typeof TextBlockSchema>;
