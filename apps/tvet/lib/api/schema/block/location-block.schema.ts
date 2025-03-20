import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { ImageSchema } from "@/lib/api/schema/image-file.schema";

export const LocationBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("location"),

  hint: z.string(),
  image: z.array(ImageSchema),
  show_map: z.boolean(),
  show_directions: z.boolean(),
  address: z.object({
    country_code: z.string(),
    administrative_area: z.string().nullable(),
    locality: z.string().nullable(),
    dependent_locality: z.string().nullable(),
    postal_code: z.string(),
    address_line: z.string(),
    organization: z.string().nullable(),
  }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export type LocationBlockType = z.infer<typeof LocationBlockSchema>;
