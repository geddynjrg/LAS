import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const CourseDataBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("course_data"),

  description: DescriptionSchema,
  training_format: z.object({
    value: z.string(),
    format: z.string(),
    processed: z.string(),
  }),
  group_size: z.object({
    value: z.string(),
    format: z.string(),
    processed: z.string(),
  }),
  minimum_entry_requirements: z.object({
    value: z.string(),
    format: z.string(),
    processed: z.string(),
  }),
});

export type CourseDataBlockType = z.infer<typeof CourseDataBlockSchema>;
