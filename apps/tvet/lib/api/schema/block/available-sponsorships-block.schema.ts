import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { SponsorshipSchema } from "@/lib/api/schema/sponsorship.schema";

export const AvailableSponsorshipsBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("available_sponsorships"),

  sponsorships: z.array(SponsorshipSchema),
});

export type AvailableSponsorshipsBlockType = z.infer<
  typeof AvailableSponsorshipsBlockSchema
>;
