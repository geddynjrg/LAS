"use server";

import { getLocale } from "next-intl/server";

import { api } from "@/lib/api/utils";

export async function getInstitutions() {
  const res = await api.GET("/api/v1/institutions", {
    params: { header: { "X-Language": await getLocale() } },
  });

  return res.data?.data?.institutions;
}
