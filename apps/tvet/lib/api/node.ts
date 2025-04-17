"use server";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";

import type { CourseNodeType } from "@/lib/api/schema/node/course-node.schema";
import { NodeSchema } from "@/lib/api/schema/node/node-types";
import { api, validate } from "@/lib/api/utils";

interface NodeParams {
  page?: string;
  perPage?: string;
}

export async function getNodeById(id: string) {
  const res = await api.GET("/api/v1/node/{id}", {
    params: {
      header: {
        "X-Language": await getLocale(),
      },
      path: { id },
    },
  });

  return validate(res, NodeSchema);
}

export async function getNodeByPath(params: NodeParams) {
  const headersList = await headers();

  const res = await api.GET("/api/v1/resolve", {
    params: {
      header: {
        "X-Language": await getLocale(),
        "X-Path": headersList.get("X-Path") || "",
      },
      query: { page: params?.page, per_page: params?.perPage } as any,
    },
  });

  return validate(res, NodeSchema);
}

export async function getCourseNodeById(id: string) {
  const node = await getNodeById(id);

  if (node.data?.type !== "course") {
    return undefined;
  }

  return node as CourseNodeType;
}
