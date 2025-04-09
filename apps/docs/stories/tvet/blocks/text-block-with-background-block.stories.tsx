import type { Meta, StoryObj } from "@storybook/react";

import { TextBlockWithBackgroundBlock } from "@workspace/ui/components/tvet/blocks/text-block-with-background-block";

const meta = {
  component: TextBlockWithBackgroundBlock,
  args: {
    block_type: "text_block_with_background",
    items: [
      {
        title: "Title",
        description: {
          value: "Description",
          format: "full_html",
          processed: "<p>Description</p>",
        },
      },
    ],
  },
  argTypes: {
    items: {
      control: {
        type: "object",
      },
    },
    index: {
      description: "The index currently controls the color of the background",
      control: {
        type: "number",
        max: 3,
        min: 1,
      },
    },
  },
} satisfies Meta<typeof TextBlockWithBackgroundBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
