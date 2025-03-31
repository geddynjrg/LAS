"use server";

import { NodeSchema } from "@/lib/api/schema/node/node-types";
import { api, validate } from "@/lib/api/utils";

export async function getNode() {
  const res = await api.GET("/api/v1/resolve", {
    params: {
      query: { _format: "json" },
    },
  });

  return validate(res, NodeSchema);
}
