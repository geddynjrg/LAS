import { z } from 'zod';

export const SiteInformationMetaSchema = z.object({
  timestamp: z.number(),
  version: z.string(),
  language: z.object({
    current: z.string(),
    default: z.string(),
    available: z.record(
      z.string(),
      z.object({
        langcode: z.string().optional(),
        name: z.string().optional(),
        direction: z.enum(['ltr', 'rtl']).optional(),
      }),
    ),
  }),
});

export type SiteInformationMeta = z.infer<typeof SiteInformationMetaSchema>;
