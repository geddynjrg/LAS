"use server";

import { getLocale } from "next-intl/server";

import type { components } from "@/lib/api/schema/schema";
import { api } from "@/lib/api/utils";

export async function getApplicationProgress(data: { id: string }) {
  const res = await api.GET("/api/v1/application/{application_id}/progress", {
    params: {
      header: { "X-Language": await getLocale() },
      path: { application_id: data.id },
    },
  });

  return res.data?.data;
}

export async function createApplication(data: { course_id?: number }) {
  const res = await api.POST("/api/v1/application", {
    params: {
      header: { "X-Language": await getLocale() },
      query: data,
    },
  });

  if (res.error) {
    console.warn("createApplication error", res.error);

    return {
      success: false,
      error: res.error,
    };
  }

  return {
    success: !!res.data?.success,
    data: res.data?.data,
  };
}

export async function updateApplication(
  id: string,
  data: components["schemas"]["ApplicationStepRequest"],
  // & (
  //     | components["schemas"]["NationalIdSchema"]
  //     | components["schemas"]["BirthCertificateSchema"]
  //     | components["schemas"]["AlienIdSchema"]
  //   ),
) {
  const res = await api.PATCH(
    "/api/v1/application/{application_id}/step/{step_name}",
    {
      params: {
        header: { "X-Language": await getLocale() },
        path: { application_id: id, step_name: data.step_type },
      },
      body: data,
    },
  );

  if (res.error) {
    console.warn("updateApplication error", res.error);

    return {
      success: false,
      error: res.error,
    };
  }

  return {
    success: !!res.data?.success,
    data: res.data?.data,
  };
}
