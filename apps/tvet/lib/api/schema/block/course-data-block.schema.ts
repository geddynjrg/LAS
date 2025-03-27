import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const CourseDataBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("course_data"),

  description: DescriptionSchema,
  training_format: z
    .object({
      value: z.string(),
      format: z.string(),
      processed: z.string(),
    })
    .optional(),
  minimum_entry_requirements: z
    .object({
      value: z.string(),
      format: z.string(),
      processed: z.string(),
    })
    .optional(),
  equipment_available_at_ins: z
    .object({
      value: z.string(),
      format: z.string(),
      processed: z.string(),
    })
    .optional(),
  course_fee: z.number().optional(),
  group_size: z.number().optional(),
  test_booking_fee: z.number().optional(),
  application_fee: z.number().optional(),
});

export type CourseDataBlockType = z.infer<typeof CourseDataBlockSchema>;
