import type { Meta, StoryObj } from "@storybook/react";

import { TextWithGradientBlock } from "@workspace/ui/components/tvet/blocks/text-with-gradient-block";

const meta = {
  component: TextWithGradientBlock,
  args: {
    block_type: "text_block_with_gradient",
    block_text: [
      {
        value: "Greed",
        format: "full_html",
        processed: "<p>Description</p>",
      },
      {
        value: "Red",
        format: "full_html",
        processed: "<p>Description</p>",
      },
      {
        value: "Blue",
        format: "full_html",
        processed: "<p>Description</p>",
      },
    ],
  },
} satisfies Meta<typeof TextWithGradientBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Color is currently handled on item iteration sequentially
 */
export const Primary = {} satisfies Story;
