import { z } from "zod";

export const addressSchema = z.object({
  country_code: z.string(),
  administrative_area: z.null(),
  locality: z.string(),
  dependent_locality: z.null(),
  postal_code: z.string(),
  address_line: z.string(),
  organization: z.null(),
});
