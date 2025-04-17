import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { ImageSchema } from "@/lib/api/schema/image-file.schema";

export const MediaBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("media"),

  media: z.array(ImageSchema),
});

export type MediaBlockBlockType = z.infer<typeof MediaBlockSchema>;
