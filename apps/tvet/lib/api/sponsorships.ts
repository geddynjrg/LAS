"use server";

import { z } from "zod";

import { ImageSchema } from "@/lib/api/schema/image-file.schema";
import { BlockSchema } from "@/lib/api/types";
import { api, validate } from "@/lib/api/utils";

export async function getSponsorships() {
  const res = await api.GET("/api/v1/resolve", {
    headers: { "x-path": "/sponsorships" },
    params: {
      query: { _format: "json" },
    },
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
        page_components: z.array(BlockSchema),
      }),
    })
    .optional(),
  meta: z
    .object({
      pagination: z.object({
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        pages: z.number(),
      }),
      filters: z.object({
        search: z.string().nullable(),
        min_fee: z.number().nullable(),
        max_fee: z.number().nullable(),
        min_duration: z.number().nullable(),
        max_duration: z.number().nullable(),
        education_level: z.string().nullable(),
        institution: z.number().nullable(),
      }),
      sort: z.object({
        field: z.string(),
        direction: z.string(),
      }),
      filter_options: z.object({
        education_levels: z.array(z.string()),
        institutions: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            path_alias: z.string(),
          }),
        ),
      }),
    })
    .optional(),
});
