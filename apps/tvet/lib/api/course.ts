"use server";

import { z } from "zod";

import { BlockSchema, ImageSchema } from "@/lib/api/types";
import { api, validate } from "@/lib/api/utils";

export async function getCourseData(course: string) {
  const res = await api.GET("/api/v1/node/{id}", {
    params: { path: { id: course } },
  });

  return validate(res, schema);
}

const schema = z.object({
  data: z
    .object({
      id: z.string(),
      type: z.string(),
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
        body: z.object({
          value: z.string(),
          format: z.string(),
          processed: z.string(),
        }),
        image: ImageSchema,
        tags: z.array(z.string()),
        institution: z.object({
          id: z.string(),
          type: z.literal("institution"),
          uuid: z.string(),
          title: z.string(),
          path_alias: z.string(),
        }),
        page_components: z.array(BlockSchema),
      }),
    })
    .optional(),
});
