import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";
import { ImageSchema } from "@/lib/api/schema/image-file.schema";

export const SectionHeadingBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("section_heading"),

  title: z.string(),
  description: DescriptionSchema,
  image: z.array(ImageSchema),
});

export type SectionHeadingBlockType = z.infer<typeof SectionHeadingBlockSchema>;
