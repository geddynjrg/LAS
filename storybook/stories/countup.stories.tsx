import type { Meta, StoryObj } from "@storybook/react";

import { Countup } from "@workspace/ui/components/countup";

const meta = {
  component: Countup,
  args: {
    end: 1000000,
    duration: 5,
    start: 0,
    decimals: 0,
    useEasing: true,
    useGrouping: true,
    separator: ",",
  },
} satisfies Meta<typeof Countup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
