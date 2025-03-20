"use server";

import { z } from "zod";

import { NodeSchema } from "@/lib/api/schema/node/node-types";
import { api, validate } from "@/lib/api/utils";

export async function getPageData() {
  const res = await api.GET("/api/v1/resolve", {
    cache: "no-store",
    params: {
      query: {
        // @ts-ignore - temporary fix for cache busting
        ts: Date.now().toString(),
      },
    },
  });

  console.log("pageRES", res.data);

  return validate(res, NodeSchema);
}
