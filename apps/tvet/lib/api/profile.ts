import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

export async function profile() {
  const res = await api.GET("/api/v1/user/profile" as any, {});

  return validate(res, schema);
}

export const schema = z.object({
  data: z.object({
    name: z.string(),
    email: z.string(),
  }),
});
