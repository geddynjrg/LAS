import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { CourseSchema } from "@/lib/api/schema/course.schema";

export const SimilarCoursesBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("similar_courses"),

  courses: z.array(CourseSchema),
});

export type SimilarCoursesBlockType = z.infer<typeof SimilarCoursesBlockSchema>;
