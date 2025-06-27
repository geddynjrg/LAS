import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

export async function login(data: { username: string; password: string }) {
  const res = await api.POST("/api/v1/user/login", {
    body: {
      username: data.username,
      password: data.password,
    },
  });

  if (!res.response.ok) {
    if (res.response.status === 401) {
      throw new Error("Invalid email or password");
    }
    if (res.response.status === 400) {
      throw new Error("Please check your email and password");
    }
    throw new Error(`Login failed: ${res.response.statusText}`);
  }

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