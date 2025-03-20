import { z } from "zod";

export const AbstractBlockSchema = z.object({
  block_type: z.string(),
});
