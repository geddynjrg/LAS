import type { BannerBlock, TextBlocksContainer } from "@/lib/api/schema";
import type { BlockType } from "@/lib/api/types";

// Type guards for block components
export function isBannerBlock(component: BlockType): component is BannerBlock {
  return component.block_type === "banner";
}

export function isTextBlocksContainer(
  component: BlockType,
): component is TextBlocksContainer {
  return component.block_type === "text_blocks";
}
