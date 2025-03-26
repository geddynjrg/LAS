"use server";

import { LandingNodeSchema } from "@/lib/api/schema/node/landing-node.schema";
import { api, validate } from "@/lib/api/utils";

export async function getSponsorships() {
  const res = await api.GET("/api/v1/resolve", {
    headers: { "x-path": "/sponsorships" },
    params: {
      query: { _format: "json" },
    },
  });

  return validate(res, LandingNodeSchema);
}
