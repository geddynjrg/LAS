import { z } from 'zod';

export const DescriptionSchema = z.object({
  value: z.string().nullable(),
  format: z.enum(['basic_html', 'full_html', 'plain_text']).nullable(),
  processed: z.string().nullable(),
});

export type Description = z.infer<typeof DescriptionSchema>;
