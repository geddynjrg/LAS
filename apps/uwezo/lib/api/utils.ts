import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import createClient, { type FetchResponse } from "openapi-fetch";
import type { z } from "zod";

import { getSession } from "@/lib/session";
import type { paths } from "./schema/schema";

export const api = createClient<paths>({
  baseUrl: process.env.NEXT_API_URL,
});

api.use({
  async onRequest({ request }) {
    const [headersList, session] = await Promise.all([headers(), getSession()]);

    if (!request.headers.has("Content-Type")) {
      request.headers.set("Content-Type", "application/json");
    }

    if (!request.headers.has("X-Path")) {
      request.headers.set("X-Path", headersList.get("x-path") || "");
    }

    if (!request.headers.has("X-Language")) {
      request.headers.set("X-Language", (await getLocale()) || "");
    }

    if (session) {
      request.headers.set("authorization", `Bearer ${session}`);
    }

    return request;
  },

  async onResponse({ response, request }) {
    // Check if this is a protected API call (not login/logout/register)
    const isAuthEndpoint =
      request.url.includes("/login") ||
      request.url.includes("/logout") ||
      request.url.includes("/register") ||
      request.url.includes("/password/reset");

    // Only redirect on 401 for protected endpoints
    if (response.status === 401 && !isAuthEndpoint) {
      redirect("/logout");
    }

    return response;
  },
});

export function validate<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TRes extends FetchResponse<any, any, any>,
  TSchema extends z.Schema,
>(res: TRes, schema: TSchema) {
  // return error if response is not ok
  if (res.error) {
    console.warn("[API] Error:", res.response.status, res.error);
    throw new Error(res.error?.message || "[API] Unknown Error");
  }

  const validation = schema.safeParse(res.data);

  // return response even if validation fails, but log out the errors
  if (!validation.success) {
    console.warn(
      `[API] Response Schema Error (${res.response.url}):`,
      validation.error.toString(),
      res.data,
    );
  }

  return res.data as z.infer<TSchema>;
}
