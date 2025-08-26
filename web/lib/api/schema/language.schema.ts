import { z } from 'zod';

// Schema for language information
export const LanguageSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  direction: z.string().optional(),
});

export type Language = z.infer<typeof LanguageSchema>;
