import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const FeatureSchema = AbstractBlockSchema.extend({
  block_type: z.literal("feature"),

  feature: z.string(),
  short_description: DescriptionSchema,
});
