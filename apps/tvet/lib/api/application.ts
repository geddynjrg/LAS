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
  data: components["schemas"]["ApplicationStepRequest"] &
    (
      | Partial<components["schemas"]["NationalIdSchema"]>
      | Partial<components["schemas"]["GuardianNationalIdSchema"]>
      | Partial<components["schemas"]["BirthCertificateSchema"]>
      | Partial<components["schemas"]["GuardianBirthCertificateSchema"]>
      | Partial<components["schemas"]["GuardianAlienIdSchema"]>
      | Partial<components["schemas"]["AlienIdSchema"]>
    ),
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

export async function getIntroContent() {
  return (
    await api.GET("/api/v1/application/intro", {
      params: {
        header: { "X-Language": await getLocale() },
      },
    })
  ).data?.data;
}

export async function getThankYouContent(applicationId: string) {
  return (
    await api.GET("/api/v1/application/{application_id}/thank-you", {
      params: {
        header: { "X-Language": await getLocale() },
        path: { application_id: applicationId },
      },
    })
  ).data?.data;
}
