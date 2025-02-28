import type { Meta, StoryObj } from "@storybook/react";

import { RoundedCornerCard } from "@workspace/ui/components/tvet/rounded-corner-card";

const meta = {
  component: RoundedCornerCard,
  args: {
    children:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, quia.",
  },
} satisfies Meta<typeof RoundedCornerCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
