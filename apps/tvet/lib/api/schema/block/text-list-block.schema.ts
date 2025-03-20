import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const TextListBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("text_list"),

  title: z.string(),
  short_description: DescriptionSchema,
  type: z.string(),
  items: z.array(z.string()),
});

export type TextListBlockType = z.infer<typeof TextListBlockSchema>;
