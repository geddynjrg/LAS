import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

export async function register(data: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await api.POST("/api/v1/user/register", {
    body: {
      name: [{ value: data.username }],
      mail: [{ value: data.email }],
      pass: [{ value: data.password }],
    },
  });

  return validate(res, schema);
}

export const schema = z.object({
  data: z.object({
    mail: z.string(),
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.number(),
    token_type: z.string(),
    status: z.string(),
  }),
});
