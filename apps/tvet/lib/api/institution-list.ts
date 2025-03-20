"use server";

import { z } from "zod";

import { DescriptionSchema } from "@/lib/api/schema/description.schema";
import { ImageSchema } from "@/lib/api/schema/image-file.schema";
import { BlockSchema } from "@/lib/api/types";
import { api, validate } from "@/lib/api/utils";

export async function getInstitutionData(institute: string) {
  const res = await api.GET("/api/v1/institutions", {
    params: { path: { id: institute } },
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
      contact_text: DescriptionSchema,
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
});
