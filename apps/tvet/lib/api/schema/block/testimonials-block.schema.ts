import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";
import { ImageSchema } from "@/lib/api/schema/image-file.schema";

export const TestimonialsBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("testimonials"),

  testimonials: z.array(
    z.object({
      block_type: z.literal("testimonial"),
      name: z.string(),
      short_description: DescriptionSchema,
      image: z.array(ImageSchema),
    }),
  ),
});

export type TestimonialsBlockType = z.infer<typeof TestimonialsBlockSchema>;
