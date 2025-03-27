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
    const [headersList, locale, session] = await Promise.all([
      headers(),
      getLocale(),
      getSession(),
    ]);

    request.headers.set("x-path", headersList.get("x-path") || "");
    request.headers.set("x-language", locale || "");

    if (session) {
      request.headers.set("authorization", `Bearer ${session}`);
    }

    return request;
  },

  async onResponse({ response }) {
    if (response.status === 401) {
      //handle unauthorized error
      console.warn("[API] Unauthorized:", response.status);
      redirect("/login");
    }

    return response;
  },
});

export function validate<
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
