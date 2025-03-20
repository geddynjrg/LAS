import { z } from "zod";

import { addressSchema } from "@/lib/api/schema/address.schema";

export const InstitutionSchema = z.object({
  id: z.string(),
  title: z.string(),
  address: addressSchema,
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  url: z.string(),
  path_alias: z.string(),
});

export type InstitutionType = z.infer<typeof InstitutionSchema>;
