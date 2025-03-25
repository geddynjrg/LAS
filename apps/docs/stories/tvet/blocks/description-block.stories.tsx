import type { Meta, StoryObj } from "@storybook/react";

import { DescriptionBlock } from "@workspace/ui/components/tvet/blocks/description-block";

const meta = {
  component: DescriptionBlock,

  args: {
    value:
      "<p>The course is based on primary and secondary leaver’s students who are willingly and ready to acquire electrical knowledge and skills.</p>",
    format: "full_html",
    processed:
      "<p>The course is based on primary and secondary leaver’s students who\nare willingly and ready to acquire electrical knowledge and skills.</p>",
  },
} satisfies Meta<typeof DescriptionBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Description block is able to display and process HTML content,
 * applying some page specific styles
 */
export const Primary = {} satisfies Story;
