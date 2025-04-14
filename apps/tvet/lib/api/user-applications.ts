import { getLocale } from "next-intl/server";
import { z } from "zod";

import { api, validate } from "@/lib/api/utils";

export async function getUserApplications() {
  const res = await api.GET("/api/v1/my-applications", {
    params: {
      header: {
        "X-Language": await getLocale(),
      },
    },
  });
  return validate(res, schema);
}

const schema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      application_id: z.string(),
      application_status: z.string(), // created, completed, reviewing, accepted, rejected, pending, confirmed
      payment_status: z.string(), // unpaid, pending, proof_uploaded, paid, rejected
      institution: z.string(),
      course: z.string(),
      created: z.string(),
      changed: z.string(),
      _links: z
        .object({
          self: z.object({
            href: z.string().optional(),
          }),
          payment_info: z.object({
            href: z.string().optional(),
          }),
          payment_info_pdf: z.object({
            href: z.string().optional(),
          }),
        })
        .optional(),
    }),
  ),
});
