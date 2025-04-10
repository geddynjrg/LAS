"use server";

import { NodeSchema } from "@/lib/api/schema/node/node-types";
import { api, validate } from "@/lib/api/utils";

interface NodeParams {
  page?: string;
  perPage?: string;
}

export async function getNode(params: NodeParams) {
  const res = await api.GET("/api/v1/resolve", {
    params: {
      query: { page: params?.page, per_page: params?.perPage } as any,
    },
  });

  return validate(res, NodeSchema);
}
