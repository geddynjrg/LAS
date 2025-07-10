import { UserProfileResponseSchema } from "@/lib/api/schema/response/auth-response.schema";
import { api, validate } from "@/lib/api/utils";

export async function getProfile() {
  const res = await api.GET("/api/v1/user/profile");

  if (!res.response.ok) {
    if (res.response.status === 401) {
      throw new Error("Authentication required");
    }
    if (res.response.status === 404) {
      throw new Error("User not found");
    }
    throw new Error(`Failed to get profile: ${res.response.statusText}`);
  }

  return validate(res, UserProfileResponseSchema);
}
