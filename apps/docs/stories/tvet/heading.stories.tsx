import type { Meta, StoryObj } from "@storybook/react";

import { Heading } from "@workspace/ui/components/tvet/heading";

const meta = {
  component: Heading,
  args: {
    children: "Heading",
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
