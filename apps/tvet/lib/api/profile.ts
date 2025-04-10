import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

export async function getProfile() {
  const res = await api.GET("/api/v1/user/profile");
  return validate(res, schema);
}

const schema = z.object({
  data: z.object({
    name: z.string(),
    email: z.string(),
  }),
});
