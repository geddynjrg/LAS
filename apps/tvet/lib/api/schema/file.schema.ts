import { z } from "zod";

export const FileSchema = z.object({
  id: z.string(),
  type: z.string(),
  bundle: z.string(),
  name: z.string(),
  uuid: z.string(),
  url: z.string(),
  mime_type: z.string(),
  size: z.number(),
});
