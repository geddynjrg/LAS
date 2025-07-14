import { z } from "zod";

import { DescriptionSchema } from "@/lib/api/schema/description.schema";
import { AvailableLanguagesSchema } from "@/lib/api/schema/language-availability.schema";
import { BlockSchema } from "@/lib/api/types";

export const LandingNodeSchema = z.object({
  data: z.object({
    id: z.string(),
    type: z.literal("landing"),
    uuid: z.string(),
    title: z.string(),
    language: z
      .object({
        code: z.string().optional(),
        name: z.string().optional(),
        direction: z.string().optional(),
      })
      .optional(),
    url: z.string(),
    path_alias: z.string(),
    content: z.object({
      body: DescriptionSchema.optional(),
      page_components: z.array(BlockSchema).optional(),
    }),
  }),
  meta: z.object({
    timestamp: z.number(),
    version: z.string(),
    language: z.object({
      current: z.string(),
      default: z.string(),
      available: AvailableLanguagesSchema,
    }),
  }),
});

export type LandingNode = z.infer<typeof LandingNodeSchema>;
