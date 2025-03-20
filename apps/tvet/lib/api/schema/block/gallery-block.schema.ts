import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";
import { ImageSchema } from "@/lib/api/schema/image-file.schema";

export const GalleryBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("gallery"),

  title: z.string(),
  description: DescriptionSchema,
  images: z.array(ImageSchema),
});

export type GalleryBlockType = z.infer<typeof GalleryBlockSchema>;
