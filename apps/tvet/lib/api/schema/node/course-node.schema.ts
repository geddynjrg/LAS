import { z } from "zod";

import { ImageSchema } from "@/lib/api/schema/image-file.schema";
import { BlockSchema } from "@/lib/api/types";

export const CourseNodeSchema = z.object({
  data: z
    .object({
      id: z.string(),
      type: z.literal("course"),
      uuid: z.string(),
      title: z.string(),
      language: z.object({
        code: z.string(),
        name: z.string(),
        direction: z.string(),
      }),
      url: z.string(),
      path_alias: z.string(),
      content: z.object({
        application_fee: z.number().nullable(),
        apply_till: z.array(z.string()),
        course_fee: z.number().nullable(),
        duration: z.number().nullable(),
        education_level: z.array(z.any()),
        body: z
          .object({
            value: z.string().nullable(),
            format: z.string().nullable(),
            processed: z.string().nullable(),
          })
          .optional(),
        image: z.array(ImageSchema),
        tags: z.array(z.string()),
        institution: z.object({
          id: z.string(),
          type: z.string(),
          uuid: z.string(),
          title: z.string(),
          path_alias: z.string(),
        }),
        page_components: z.array(BlockSchema),
      }),
    })
    .optional(),
  meta: z.object({
    timestamp: z.number(),
    version: z.string(),
    language: z.object({
      current: z.string(),
      default: z.string(),
      available: z.record(
        z.string(),
        z.object({
          langcode: z.string(),
          name: z.string(),
          url: z.string(),
          path: z.string(),
        }),
      ),
    }),
  }),
});

export type CourseNodeType = z.infer<typeof CourseNodeSchema>;
