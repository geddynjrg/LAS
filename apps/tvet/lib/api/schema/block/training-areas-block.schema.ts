import { z } from "zod";

import { AbstractBlockSchema } from "@/lib/api/schema/block/abstract-block.schema";
import { TrainingAreaSchema } from "@/lib/api/schema/training-area.schema";

export const TrainingAreasBlockSchema = AbstractBlockSchema.extend({
  block_type: z.literal("training_areas"),

  areas: z.array(TrainingAreaSchema),
});

export type TrainingAreasBlockType = z.infer<typeof TrainingAreasBlockSchema>;
