import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { DescriptionSchema } from "@/lib/api/schema/description.schema";

export const ApplicationBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("application"),

  title: z.string(),
  description: DescriptionSchema,
  checkpoints: z.array(z.string()),
});

export type ApplicationBlockType = z.infer<typeof ApplicationBlockSchema>;
