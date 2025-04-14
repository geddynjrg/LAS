"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

export async function getInstitutions() {
  const res = await api.GET("/api/v1/institutions", {
    params: { header: { "X-Language": await getLocale() } },
  });

  return validate(res, schema);
}

const schema = z.object({
  data: z
    .object({
      institutions: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          path_alias: z.string(),
        }),
      ),
    })
    .optional(),
});
