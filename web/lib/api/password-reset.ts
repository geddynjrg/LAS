import { PasswordResetResponseSchema } from "@/lib/api/schema/response/auth-response.schema";
import { api, validate } from "@/lib/api/utils";

export async function passwordReset(data: {
  uid: string;
  timestamp: string;
  hash: string;
  new_password: string;
}) {
  const res = await api.POST("/api/v1/user/password/reset", {
    body: {
      uid: data.uid,
      timestamp: data.timestamp,
      hash: data.hash,
      new_password: data.new_password,
    },
  });

  return validate(res, PasswordResetResponseSchema);
}
