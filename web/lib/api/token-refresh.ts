import { TokenRefreshResponseSchema } from "@/lib/api/schema/response/auth-response.schema";
import { api, validate } from "@/lib/api/utils";

export async function refreshToken(data: { refresh_token: string }) {
  const res = await api.POST("/api/v1/user/token/refresh", {
    body: {
      refresh_token: data.refresh_token,
    },
  });

  if (!res.response.ok) {
    if (res.response.status === 401) {
      throw new Error("Invalid or expired refresh token");
    }
    if (res.response.status === 400) {
      throw new Error("Invalid request parameters");
    }
    throw new Error(`Token refresh failed: ${res.response.statusText}`);
  }

  return validate(res, TokenRefreshResponseSchema);
}
