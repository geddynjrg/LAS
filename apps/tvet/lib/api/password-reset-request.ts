import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

export async function passwordResetRequest(data: { email: string }) {
  const res = await api.POST("/api/v1/user/password/reset-request", {
    body: {
      email: data.email,
    },
  });

  return validate(res, schema);
}

export const schema = z.object({
  data: z.object({
    message: z.string(),
  }),
});
