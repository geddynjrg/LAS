import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { CourseSchema } from "@/lib/api/schema/course.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const CoursesBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("courses"),

  title: z.string(),
  short_description: DescriptionSchema,
  courses: z.array(CourseSchema),
});

export type CoursesBlockType = z.infer<typeof CoursesBlockSchema>;
