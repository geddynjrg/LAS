import { getLocale } from "next-intl/server";

import { api } from "@/lib/api/utils";

export async function getUserApplications() {
  const res = await api.GET("/api/v1/my-applications", {
    params: {
      header: {
        "X-Language": await getLocale(),
      },
    },
  });

  return res.data?.data ?? [];
}
