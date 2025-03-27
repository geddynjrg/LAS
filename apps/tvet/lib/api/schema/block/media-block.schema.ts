import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { SingleImageSchema } from "@/lib/api/schema/image-file.schema";

export const MediaBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("media"),

  media: SingleImageSchema,
});

export type MediaBlockBlockType = z.infer<typeof MediaBlockSchema>;
