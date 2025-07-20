import { z } from "zod";

export const UsefulLinkSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  url: z.string().url(),
  weight: z.number(),
  external: z.boolean(),
});

export type UsefulLink = z.infer<typeof UsefulLinkSchema>; 