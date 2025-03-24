import type { Meta, StoryObj } from "@storybook/react";

import { TextBlock } from "@workspace/ui/components/tvet/blocks/text-block";

const meta = {
  component: TextBlock,
  args: {
    block_type: "text_block",
    title: "Text Block",
    description: {
      value: "This is a text block",
      format: "full_html",
      processed: "This is a text block",
    },
  },
} satisfies Meta<typeof TextBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
