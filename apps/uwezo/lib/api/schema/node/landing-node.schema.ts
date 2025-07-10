import { z } from "zod";

import { DescriptionSchema } from "@/lib/api/schema/description.schema";
import { BlockSchema } from "@/lib/api/types";

// Schema for individual language availability
export const LanguageAvailabilitySchema = z.object({
  langcode: z.string(),
  name: z.string(),
  url: z.string(),
  path: z.string(),
});

// Schema for available languages object
export const AvailableLanguagesSchema = z.record(
  z.string(),
  LanguageAvailabilitySchema,
);

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

export type LanguageAvailability = z.infer<typeof LanguageAvailabilitySchema>;
export type AvailableLanguages = z.infer<typeof AvailableLanguagesSchema>;
export type LandingNode = z.infer<typeof LandingNodeSchema>;
