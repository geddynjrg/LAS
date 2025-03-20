import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";

export const SocialBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("social_block"),

  social_links: z.array(
    z.object({
      platform: z.string(),
      url: z.string(),
      account: z.string(),
      icon: z.string(),
    }),
  ),
});

export type SocialBlockType = z.infer<typeof SocialBlockSchema>;
