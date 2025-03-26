import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import createClient from "openapi-fetch";
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
      console.warn("Unauthorized:", response.status);
      redirect("/login");
    }
  },
});

export function validate<T extends z.Schema>(
  res: Record<string, unknown>,
  schema: T,
) {
  const response = (res as any)?.data ?? res;

  if (res.error) {
    //handle API error
    console.warn("API Error:", response.status, response.error);
    throw new Error(response?.error?.message);
  }

  const result = schema.safeParse(response.data);

  // return response even if validation fails, but log out the errors
  if (!result.success) {
    console.warn(result.error.toString());
  }

  return response as z.infer<T>;
}
