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
  minimum_entry_requirements: z.object({
    value: z.string(),
    format: z.string(),
    processed: z.string(),
  }),
  equipment_available_at_ins: z.object({
    value: z.string(),
    format: z.string(),
    processed: z.string(),
  }),
  course_fee: z.number(),
  group_size: z.number(),
  test_booking_fee: z.number(),
  application_fee: z.number(),
});

export type CourseDataBlockType = z.infer<typeof CourseDataBlockSchema>;
