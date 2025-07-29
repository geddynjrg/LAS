import type { Meta, StoryObj } from "@storybook/react";

import { Divider } from "@workspace/ui/components/divider";

const meta = {
  component: Divider,
  args: {
    children: "Divider",
  },
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary = {} satisfies Story;

export const NoText = {
  render: () => <Divider />,
} satisfies Story;

export const Styled = {
  render: () => (
    <Divider className="border-orange-500 text-blue-500">Styled</Divider>
  ),
} satisfies Story;
