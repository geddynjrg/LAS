import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { InstitutionSchema } from "@/lib/api/schema/institution.schema";

export const VocationalCentresBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("vocational_centres"),

  institutions: z.array(InstitutionSchema),
});

export type VocationalCentresBlockType = z.infer<
  typeof VocationalCentresBlockSchema
>;
