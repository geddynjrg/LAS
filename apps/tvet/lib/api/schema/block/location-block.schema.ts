import { z } from "zod";

import { addressSchema } from "@/lib/api/schema/address.schema";
import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { ImageSchema } from "@/lib/api/schema/image-file.schema";

export const LocationBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("location"),

  hint: z.string(),
  image: z.array(ImageSchema),
  show_map: z.boolean(),
  show_directions: z.boolean(),
  address: addressSchema,
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export type LocationBlockType = z.infer<typeof LocationBlockSchema>;
