import { z } from "zod";

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()),
  application_fee: z.number().nullable(),
  course_fee: z.number().nullable(),
  apply_till: z.array(z.string()),
  start_on: z.array(z.string()),
  institution: z.preprocess(
    (data) => (Array.isArray(data) ? data[0] : data),
    z.object({
      id: z.string(),
      type: z.string(),
      uuid: z.string(),
      title: z.string(),
      path_alias: z.string(),
    }),
  ),
  url: z.string(),
  path_alias: z.string(),
});
