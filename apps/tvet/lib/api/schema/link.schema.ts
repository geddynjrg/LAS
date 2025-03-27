import { z } from "zod";

export const LinkSchema = z.object({
  title: z.string(),
  url: z.string(),
  options: z.array(z.unknown()),
  is_external: z.boolean().optional(),
});

export type LinkType = z.infer<typeof LinkSchema>;
