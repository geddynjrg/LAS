import { z } from 'zod';

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

export type LanguageAvailability = z.infer<typeof LanguageAvailabilitySchema>;
export type AvailableLanguages = z.infer<typeof AvailableLanguagesSchema>;
