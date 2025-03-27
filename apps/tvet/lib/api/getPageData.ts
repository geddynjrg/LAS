"use server";

import { NodeSchema } from "@/lib/api/schema/node/node-types";
import { api, validate } from "@/lib/api/utils";

export async function getPageData() {
  const res = await api.GET("/api/v1/resolve", {
    params: {
      query: { _format: "json" },
    },
  });

  console.log("pageRES", res.data);

  return validate(res, NodeSchema);
}
