import { z } from "zod";

import { LinkButtonSchema } from "@/lib/api/schema/link-button.schema";
import { TextBlockSchema } from "@/lib/api/schema/block/text-block.schema";

export const TextBlocksContainerSchema = z.object({
  block_type: z.literal("text_blocks"),
  blocks: z.array(TextBlockSchema),
  button: z.array(LinkButtonSchema).optional(),
});

export type TextBlocksContainer = z.infer<typeof TextBlocksContainerSchema>;
