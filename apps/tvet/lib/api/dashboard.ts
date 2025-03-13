"use server";

import { z } from "zod";

import { BlockSchema } from "@/lib/api/types";
import { api, validate } from "@/lib/api/utils";

export async function getDashboardData() {
  const res = await api.GET("/api/v1/resolve", {
    params: { query: { _format: "json" } },
  });

  return validate(res, schema);
}

const schema = z.object({
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
    image: z.array(z.unknown()),
    page_components: z.array(BlockSchema),
  }),
});
