import { z } from 'zod';

export const LinkButtonSchema = z.object({
  title: z.string(),
  url: z.string(),
  options: z.array(z.unknown()),
  is_external: z.boolean(),
});

export type LinkButton = z.infer<typeof LinkButtonSchema>;
