import type { Meta, StoryObj } from "@storybook/react";

import { TextListBlock } from "@workspace/ui/components/tvet/blocks/text-list-block";

const meta = {
  component: TextListBlock,
  args: {
    block_type: "text_list",
    title: "Text List Block",
    items: ["Item 1", "Item 2", "Item 3"],
    short_description: {
      value: "This is a text list block",
      format: "full_html",
      processed: "This is a text list block",
    },
    type: "bulletNumbers",
  },
} satisfies Meta<typeof TextListBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
