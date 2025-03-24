import { z } from "zod";

export const addressSchema = z.object({
  country_code: z.string(),
  administrative_area: z.string().nullable(),
  locality: z.string().nullable(),
  dependent_locality: z.string().nullable(),
  postal_code: z.string().nullable(),
  address_line: z.string().nullable(),
  organization: z.string().nullable(),
});
