import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { CourseSchema } from "@/lib/api/schema/course.schema";

export const HighlightedCourseListingBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("highlighted_course_listing"),

  courses: z.array(CourseSchema),
});

export type HighlightedCourseListingBlockType = z.infer<
  typeof HighlightedCourseListingBlockSchema
>;
