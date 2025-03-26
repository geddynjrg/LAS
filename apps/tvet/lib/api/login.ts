import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

export async function login(data: { username: string; password: string }) {
  const res = await api.POST("/api/v1/user/login" as any, {
    body: {
      username: data.username,
      password: data.password,
    },
  });

  return validate(res, schema);
}

export const schema = z.object({
  data: z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.number(),
    token_type: z.string(),
  }),
});
