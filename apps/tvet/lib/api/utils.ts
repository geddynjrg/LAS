import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import createClient from "openapi-fetch";
import type { z } from "zod";

import type { paths } from "./schema/schema";

export const api = createClient<paths>({
  baseUrl: process.env.NEXT_API_URL,
});

api.use({
  async onRequest({ request }) {
    const [headersList, locale] = await Promise.all([headers(), getLocale()]);

    request.headers.set("x-path", headersList.get("x-path") || "");
    request.headers.set("x-language", locale || "");

    return request;
  },
});

export function validate<T extends z.Schema>(
  res: Record<string, unknown>,
  schema: T,
) {
  const response = (res as any)?.data?.data ?? (res as any)?.data ?? res;
  const result = schema.safeParse(response);

  // return response even if validation fails, but log out the errors
  if (!result.success) {
    console.warn(result.error);
  }

  return response as z.infer<T>;
}
