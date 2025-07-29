import type { Meta, StoryObj } from "@storybook/react";

import { SortIndicator } from "@workspace/ui/components/sort-indicator";

const meta = {
  component: SortIndicator,
  args: {
    direction: undefined,
  },
  argTypes: {
    direction: {
      type: "string",
      description: "Sort direction (asc | desc)",
      control: { type: "select" },
      options: [undefined, "asc", "desc"],
    },
  },
} satisfies Meta<typeof SortIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
