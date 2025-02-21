import type { Meta, StoryObj } from "@storybook/react";

import { DataNode } from "@workspace/ui/components/data-node";

const meta = {
  component: DataNode,
  args: {
    label: "Label",
    children: "Children",
  },
} satisfies Meta<typeof DataNode>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;
