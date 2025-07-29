import type { Meta, StoryObj } from "@storybook/react";

import { DataNode, dataNodeVariants } from "@workspace/ui/components/data-node";

const meta = {
  component: DataNode,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: dataNodeVariants.variants.variant,
    },
  },
  args: {
    label: "Label",
    children: "Children",
    variant: "default",
  },
} satisfies Meta<typeof DataNode>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {} satisfies Story;

export const Highlighted = {
  render: (props) => <DataNode {...props} variant="highlighted" />,
} satisfies Story;

export const Disabled = {
  render: (props) => <DataNode {...props} variant="disabled" />,
} satisfies Story;
