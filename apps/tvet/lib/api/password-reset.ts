import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

export async function passwordReset(data: {
  uid: string;
  timeStamp: string;
  hash: string;
  password: string;
}) {
  const res = await api.POST("/api/v1/user/password/reset", {
    body: {
      uid: data.uid,
      timestamp: data.timeStamp,
      hash: data.hash,
      new_password: data.password,
    },
  });

  return validate(res, schema);
}

export const schema = z.object({
  data: z.object({
    message: z.string(),
  }),
});
