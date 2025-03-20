import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const CourseDataBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("course_data"),

  description: DescriptionSchema,
});

export type CourseDataBlockType = z.infer<typeof CourseDataBlockSchema>;
