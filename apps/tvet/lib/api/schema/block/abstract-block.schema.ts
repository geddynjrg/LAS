import { z } from "zod";

export const AbstractBlockSchema = z.object({
  id: z.string().optional(),
  uuid: z.string().optional(),
  block_type: z.string(),
});
