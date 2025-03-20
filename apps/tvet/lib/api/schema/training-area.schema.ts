import { z } from "zod";

export const TrainingAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  course_count: z.number(),
});
