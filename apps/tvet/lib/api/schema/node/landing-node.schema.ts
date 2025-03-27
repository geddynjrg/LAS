import { z } from "zod";

import { SingleImageSchema } from "@/lib/api/schema/image-file.schema";
import { BlockSchema } from "@/lib/api/types";

export const LandingNodeSchema = z.object({
  data: z.object({
    id: z.string(),
    type: z.literal("landing"),
    uuid: z.string(),
    title: z.string(),
    language: z.object({
      code: z.string(),
      name: z.string(),
      direction: z.string(),
    }),
    url: z.string(),
    path_alias: z.string(),
    content: z.object({
      body: z
        .object({
          value: z.string(),
          format: z.string(),
          processed: z.string(),
        })
        .optional(),
      image: SingleImageSchema,
      page_components: z.array(BlockSchema),
    }),
  }),
  meta: z.object({
    timestamp: z.number(),
    version: z.string(),
    language: z.object({
      current: z.string(),
      default: z.string(),
      available: z.record(
        z.string(),
        z.object({
          langcode: z.string(),
          name: z.string(),
          url: z.string(),
          path: z.string(),
        }),
      ),
    }),
  }),
});

export type LandingNodeType = z.infer<typeof LandingNodeSchema>;
