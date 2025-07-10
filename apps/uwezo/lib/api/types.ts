import { z } from "zod";

// Import block schemas
import { BannerBlockSchema } from "@/lib/api/schema/block/banner-block.schema";
import { TextBlocksContainerSchema } from "@/lib/api/schema/block/text-blocks-container.schema";

// Create discriminated union for all block types
export const BlockSchema = z.discriminatedUnion("block_type", [
  BannerBlockSchema,
  TextBlocksContainerSchema,
]);

export type BlockType = z.infer<typeof BlockSchema>;
